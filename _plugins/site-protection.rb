# frozen_string_literal: true

require "base64"
require "json"
require "openssl"

module SiteProtection
  ITERATIONS = 210_000
  KEY_LENGTH = 32
  SALT_LENGTH = 16
  IV_LENGTH = 12

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
  SiteProtection.scrub_generated_files(site)
end
