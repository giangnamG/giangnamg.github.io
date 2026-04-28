# frozen_string_literal: true

require "base64"
require "cgi"
require "fileutils"
require "json"
require "openssl"

module SiteProtection
  ITERATIONS = 210_000
  KEY_LENGTH = 32
  SALT_LENGTH = 16
  IV_LENGTH = 12
  PROTECTED_SEARCH_INDEX_PATH = File.join("assets", "js", "data", "search-protected.json")

  module_function

  def enabled?(site)
    site.config.dig("site_protection", "enabled") == true
  end

  def passphrase!
    value = ENV["SITE_PASSPHRASE"].to_s
    raise "SITE_PASSPHRASE is required when site_protection.enabled is true" if value.empty?

    value
  end

  def public_title(site)
    site.config.dig("site_protection", "public_title").to_s
  end

  def public_description(site)
    site.config.dig("site_protection", "public_description").to_s
  end

  def encrypt_html(plaintext)
    passphrase = passphrase!
    salt = OpenSSL::Random.random_bytes(SALT_LENGTH)
    iv = OpenSSL::Random.random_bytes(IV_LENGTH)
    key = OpenSSL::PKCS5.pbkdf2_hmac(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha256")

    cipher = OpenSSL::Cipher.new("aes-256-gcm")
    cipher.encrypt
    cipher.key = key
    cipher.iv = iv

    ciphertext = cipher.update(plaintext) + cipher.final
    tag = cipher.auth_tag

    {
      "v" => 1,
      "alg" => "AES-256-GCM",
      "kdf" => "PBKDF2-SHA256",
      "iter" => ITERATIONS,
      "salt" => Base64.strict_encode64(salt),
      "iv" => Base64.strict_encode64(iv),
      "ct" => Base64.strict_encode64(ciphertext),
      "tag" => Base64.strict_encode64(tag)
    }.to_json
  end

  def searchable_documents(site)
    documents =
      site.posts.docs +
      site.pages +
      site.collections.values.flat_map(&:docs)

    documents
      .uniq { |document| document.url }
      .select { |document| searchable_document?(document) }
  end

  def searchable_document?(document)
    return false if document.data["search"] == false

    url = document.url.to_s
    return false if url.empty?
    return false if url == "/404.html"
    return false if url.match?(%r{^/page\d+/?$})
    return false if url.start_with?("/assets/")

    output_ext = document.respond_to?(:output_ext) ? document.output_ext.to_s : File.extname(url)
    return false unless output_ext == ".html"

    layout = document.data["layout"].to_s
    return false if %w[home category tag categories tags archives].include?(layout)
    return false if %w[/categories/ /tags/ /archives/].include?(url)

    true
  end

  def build_protected_search_index(site)
    records = searchable_documents(site).map do |document|
      title = search_title_for(document)
      blocks = search_blocks_for(document)

      next if title.empty? || blocks.empty?

      blocks.each_with_index.map do |block, index|
        {
          "title" => title,
          "url" => document.url,
          "content" => block,
          "categories" => Array(document.data["categories"]).join(", "),
          "tags" => Array(document.data["tags"]).join(", "),
          "block_hash" => normalized_block_hash(block),
          "block_index" => index
        }
      end
    end.compact
    records.flatten!(1)

    records.select! do |record|
      url = record["url"].to_s
      next false if url.empty?
      next false if url.start_with?("/assets/")
      next false if url.match?(/\.(json|xml|txt)\z/i)

      true
    end

    records.sort_by! { |record| record["title"].downcase }
    records.to_json
  end

  def search_title_for(document)
    title = document.data["title"].to_s.strip
    return title unless title.empty?

    fallback = File.basename(document.path.to_s, File.extname(document.path.to_s))
    fallback.tr("-_", " ").strip
  end

  def search_blocks_for(document)
    html = document.content.to_s
    return [] if html.empty?

    search_blocks_from_html(html)
  end

  def search_blocks_from_html(html)
    blocks = html.scan(%r{<(h[1-6]|p|li|blockquote|pre|td|th)\b[^>]*>(.*?)</\1>}mi).map do |_tag, inner_html|
      clean_search_block(inner_html.gsub(%r{<br\s*/?>}i, "\n"))
    end

    blocks.reject(&:empty?).uniq
  end

  def normalized_block_hash(text)
    normalized = normalize_search_text(text)
    hash = 0x811c9dc5

    normalized.each_byte do |byte|
      hash ^= byte
      hash = (hash * 0x01000193) & 0xffffffff
    end

    hash.to_s(16).rjust(8, "0")
  end

  def normalize_search_text(text)
    text.to_s.downcase.gsub(/\s+/, " ").strip
  end

  def clean_search_block(text)
    cleaned = text.to_s.dup
    cleaned.gsub!(%r!\{\%.*?\%\}!m, " ")
    cleaned.gsub!(%r!\{\{.*?\}\}!m, " ")
    cleaned.gsub!(%r!`([^`]+)`!, " \\1 ")
    cleaned.gsub!(%r!\!\[([^\]]*)\]\([^)]+\)!, " \\1 ")
    cleaned.gsub!(%r!\[([^\]]+)\]\([^)]+\)!, " \\1 ")
    cleaned.gsub!(%r!<style.*?>.*?</style>!mi, " ")
    cleaned.gsub!(%r!<script.*?>.*?</script>!mi, " ")
    cleaned.gsub!(%r!<[^>]+>!, " ")
    cleaned = CGI.unescapeHTML(cleaned)
    cleaned.gsub!(/[ \t\f\v]+/, " ")
    cleaned.gsub!(/\s+/, " ")
    cleaned.strip
  end

  def search_content_for(document)
    source = document.content.to_s
    return "" if source.empty?

    text = source.dup
    text.gsub!(/\r\n?/, "\n")
    text.gsub!(%r!\{\%.*?\%\}!m, " ")
    text.gsub!(%r!\{\{.*?\}\}!m, " ")
    text.gsub!(%r!```+([^\n]*)\n(.*?)```+!m, " \\2 ")
    text.gsub!(%r!`([^`]+)`!, " \\1 ")
    text.gsub!(%r!\!\[([^\]]*)\]\([^)]+\)!, " \\1 ")
    text.gsub!(%r!\[([^\]]+)\]\([^)]+\)!, " \\1 ")
    text.gsub!(%r!<style.*?>.*?</style>!mi, " ")
    text.gsub!(%r!<script.*?>.*?</script>!mi, " ")
    text.gsub!(%r!<[^>]+>!, " ")
    text.gsub!(/^\s{0,3}\#{1,6}\s+/, "")
    text.gsub!(/^\s*[-*+]\s+/, "")
    text.gsub!(/^\s*\d+\.\s+/, "")
    text = CGI.unescapeHTML(text)
    text.gsub!(/[ \t\f\v]+/, " ")
    text.gsub!(/\n{2,}/, "\n")
    text.gsub!(/\s+/, " ")
    text.strip
  end

  def write_protected_search_index(site)
    destination = File.join(site.dest, PROTECTED_SEARCH_INDEX_PATH)
    FileUtils.mkdir_p(File.dirname(destination))
    File.write(destination, encrypt_html(build_protected_search_index(site)))
  end

  def scrub_generated_files(site)
    destination = site.dest
    title = public_title(site)
    description = public_description(site)

    Dir.glob(File.join(destination, "**", "*.html")).each do |path|
      html = File.read(path)

      html.gsub!(%r{<title>.*?</title>}m, "<title>#{title}</title>")
      html.gsub!(%r{<meta\s+name="description"\s+content=".*?"\s*/?>}m, %(<meta name="description" content="#{description}">))
      html.gsub!(%r{<meta\s+property="og:title"\s+content=".*?"\s*/?>}m, %(<meta property="og:title" content="#{title}" />))
      html.gsub!(%r{<meta\s+property="og:description"\s+content=".*?"\s*/?>}m, %(<meta property="og:description" content="#{description}" />))
      html.gsub!(%r{<meta\s+property="twitter:title"\s+content=".*?"\s*/?>}m, %(<meta property="twitter:title" content="#{title}" />))
      html.gsub!(%r{<script type="application/ld\+json">.*?</script>}m, "")

      unless html.include?('name="robots"')
        html.sub!(%r{</head>}i, %(<meta name="robots" content="noindex, nofollow, noarchive">\n</head>))
      end

      File.write(path, html)
    end

    empty_search_index = File.join(destination, "assets", "js", "data", "search.json")
    File.write(empty_search_index, "[]\n") if File.exist?(empty_search_index)

    feed_path = File.join(destination, "feed.xml")
    File.write(feed_path, empty_feed(site, title, description))

    sitemap_path = File.join(destination, "sitemap.xml")
    File.delete(sitemap_path) if File.exist?(sitemap_path)

    robots_path = File.join(destination, "robots.txt")
    File.write(robots_path, "User-agent: *\nDisallow: /\n")
  end

  def empty_feed(site, title, description)
    site_url = site.config["url"].to_s
    <<~XML
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>#{title}</title>
        <subtitle>#{description}</subtitle>
        <id>#{site_url}/</id>
        <link href="#{site_url}/feed.xml" rel="self"/>
        <link href="#{site_url}/"/>
        <updated>#{Time.now.utc.iso8601}</updated>
      </feed>
    XML
  end
end

module SiteProtectionFilter
  def encrypt_protected_html(input)
    SiteProtection.encrypt_html(input.to_s)
  end
end

Liquid::Template.register_filter(SiteProtectionFilter)

Jekyll::Hooks.register :site, :post_write do |site|
  next unless SiteProtection.enabled?(site)

  SiteProtection.passphrase!
  SiteProtection.write_protected_search_index(site)
  SiteProtection.scrub_generated_files(site)
end
