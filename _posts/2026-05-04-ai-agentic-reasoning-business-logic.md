---
layout: post
title: "AI Agentic Reasoning for Business Logic Bugs"
render_with_liquid: false
categories:
  - AI Agentic
tags:
  - ai-agentic
  - reasoning
  - first-order-logic
  - prolog
  - datalog
  - knowledge-graph
  - business-logic
  - static-analysis
source_collection: manual
---
Topics: AI Agentic, Logical Reasoning, Business Logic Bugs

# AI Agentic Reasoning for Business Logic Bugs

Mục tiêu của hướng nghiên cứu này là xây một hệ thống `AI agentic` có thêm lớp `symbolic reasoning` để tìm lỗi `business logic` trong source code.

Ý tưởng cốt lõi:

```text
Không để LLM chỉ đọc code rồi đoán theo pattern.
Hãy biến code, API, workflow, policy thành facts/rules có cấu trúc.
Sau đó dùng logic engine để suy luận, tìm violation, và yêu cầu LLM giải thích bằng ngôn ngữ tự nhiên.
```

Pipeline tổng quát:

```text
Source code
  -> Parser / static analyzer
  -> Code facts
  -> Domain facts / policy facts
  -> Datalog / Prolog / FOL-style rules
  -> Reasoner finds violations
  -> Knowledge graph stores context + evidence
  -> LLM explains, ranks, and suggests fixes
```

Trong pipeline này, LLM không phải là nguồn quyết định cuối cùng. LLM làm tốt phần hiểu ngôn ngữ tự nhiên, gom context, gợi ý mapping và viết report. Phần "có vi phạm logic hay không" nên được giao cho rule engine hoặc solver có semantics rõ ràng.

## Vì sao business logic bug khó tìm?

OWASP mô tả `business logic vulnerability` là lỗi xảy ra khi attacker dùng luồng xử lý hợp lệ của ứng dụng theo cách gây hậu quả xấu cho tổ chức. Điểm khó là lỗi này thường không cần payload kỳ lạ, không nhất thiết là SQL injection, XSS hay command injection. Nó nằm ở việc ứng dụng cho phép một hành vi hợp lệ về mặt kỹ thuật nhưng sai về mặt nghiệp vụ.

Ví dụ:

- Sản phẩm được giao trước khi giao dịch thanh toán được xác minh.
- Giao dịch vượt hạn mức nhưng không cần người review.
- User sửa order không thuộc quyền sở hữu của mình.
- Coupon được áp nhiều lần dù policy chỉ cho một lần.
- Endpoint refund chỉ check login nhưng không check ownership.
- Workflow cho phép bỏ qua bước approval.
- Client tự gửi `price`, `role`, `isAdmin`, `discountRate`, `status` và backend tin dữ liệu đó.

OWASP WSTG có hẳn nhóm test `Business Logic Testing`, gồm data validation, forged requests, integrity checks, process timing, usage limits, workflow circumvention, misuse defenses và payment testing. Điều này cho thấy business logic không phải một pattern đơn lẻ. Nó là một nhóm lỗi cần hiểu quan hệ giữa code, state, actor, role, money, policy và workflow.

PortSwigger Web Security Academy cũng nhấn mạnh logic flaws thường xuất hiện khi developer đưa ra assumption sai về cách user sẽ tương tác với ứng dụng. Nếu hệ thống chỉ scan signature, nó dễ bỏ sót vì request trông hoàn toàn hợp lệ.

## Giới hạn của LLM-only scanning

LLM có thể đọc code nhanh, tóm tắt tốt và phát hiện nhiều pattern quen thuộc. Nhưng nếu chỉ dựa vào LLM, hệ thống có vài vấn đề:

- Không có guarantee rằng conclusion là hệ quả logic của facts.
- Dễ bị context thiếu hoặc dài quá làm mất chi tiết.
- Dễ tạo explanation nghe hợp lý nhưng không có proof trace.
- Khó exhaustive trên toàn bộ path, role, state, endpoint.
- Khó phân biệt `unknown`, `false`, `not proven`, và `contradiction`.
- Khó tái lập kết quả nếu prompt/context thay đổi.

Vì vậy hướng tốt hơn là `neuro-symbolic`:

```text
LLM = semantic interface + extractor + explainer
Symbolic reasoner = deterministic checker + proof/counterexample generator
```

Các khảo sát gần đây về neuro-symbolic AI và LLM reasoning đều xoay quanh cùng một nhu cầu: kết hợp khả năng linh hoạt của model neural với khả năng suy luận, kiểm chứng và giải thích của symbolic systems. Với bài toán security, đặc biệt là business logic, nhu cầu này rõ hơn vì finding phải có evidence.

## Vai trò của FOL

`First-order logic` là nền tảng lý thuyết để formalize business rule.

Ví dụ policy:

```text
Mọi refund action chỉ hợp lệ nếu user sở hữu order hoặc có role admin.
```

Biểu diễn FOL:

```text
∀u∀o (
  CanRefund(u, o) →
  (Owns(u, o) ∨ HasRole(u, Admin))
)
```

Bug cần tìm:

```text
∃u∃o (
  ExecutesRefund(u, o) ∧
  ¬Owns(u, o) ∧
  ¬HasRole(u, Admin)
)
```

Hoặc dưới góc nhìn static analysis:

```text
∀h∀a (
  HandlerCalls(h, a) ∧ SensitiveAction(a) ∧ RequiresOwnership(a)
  →
  HasOwnershipCheck(h)
)
```

Violation:

```text
∃h∃a (
  HandlerCalls(h, a) ∧ SensitiveAction(a) ∧ RequiresOwnership(a) ∧
  ¬HasOwnershipCheck(h)
)
```

FOL hữu ích để thiết kế semantics:

- Entity nào là object?
- Relation nào cần biểu diễn?
- Rule nào là invariant?
- Khi nào một finding là violation?
- Khi nào thiếu evidence chỉ là unknown?
- Khi nào knowledge base bị mâu thuẫn?

Nhưng không nên dùng full FOL làm engine đầu tiên. Full FOL expressive nhưng undecidable. Phase 1 nên dùng fragment dễ kiểm soát hơn như Datalog, Horn clauses, finite-domain rules hoặc SMT tùy bài toán.

## Vai trò của Prolog

`Prolog` phù hợp để học và prototype logic vì nó cho cảm giác hỏi đáp trực tiếp với knowledge base.

Ví dụ:

```prolog
sensitive_action(refund_order).
requires_check(refund_order, ownership).

handler(refund_handler).
calls(refund_handler, refund_order).
checks(refund_handler, authenticated).

violation(Handler, missing_ownership_check) :-
    calls(Handler, Action),
    sensitive_action(Action),
    requires_check(Action, ownership),
    \+ checks(Handler, ownership).
```

Query:

```prolog
?- violation(H, Reason).
```

Kết quả:

```text
H = refund_handler
Reason = missing_ownership_check
```

Prolog mạnh ở backward chaining, tức là bắt đầu từ goal rồi tìm facts/rules để chứng minh goal. Nó hợp cho các câu hỏi như:

- Handler nào vi phạm rule?
- Có path nào từ user input tới sensitive action không?
- Resource nào bị modify mà không có authorization check?
- Có thể chứng minh `Allowed(User, Action)` không?

Tuy nhiên, Prolog có một số điểm cần thận trọng:

- `\+` là negation-as-failure, không phải phủ định classical FOL.
- Nếu rule recursive không cẩn thận có thể non-terminate.
- Scale trên codebase lớn cần tối ưu và indexing tốt.
- Không tự động giải quyết vấn đề trích xuất facts từ source code.

Vì vậy Prolog hợp làm research playground, demo nhỏ và mental model. Khi đi sang static analysis lớn, Datalog thường phù hợp hơn.

## Vai trò của Datalog

`Datalog` là lựa chọn rất hợp cho core reasoning của dự án này.

Lý do:

- Facts hữu hạn, phù hợp với source code đã parse.
- Rules dạng Horn clause, dễ đọc và dễ kiểm thử.
- Evaluation thường bottom-up, materialize được toàn bộ conclusion.
- Hợp với call graph, dataflow, control flow, dependency graph.
- Có lịch sử nghiên cứu sâu trong deductive databases và program analysis.
- Có tool như Soufflé được thiết kế cho large-scale static analysis.

Ceri, Gottlob và Tanca mô tả Datalog là query language dựa trên logic programming, dùng facts và rules để query relational database. Datalog có thể xem là cầu nối giữa AI logic programming và database systems. Đây chính là thứ dự án cần: codebase có thể biến thành database facts, còn business logic policy biến thành rules.

Ví dụ facts:

```prolog
route("POST", "/orders/:id/refund", refund_handler).
calls(refund_handler, get_order).
calls(refund_handler, refund_order).
checks(refund_handler, authenticated).

sensitive_action(refund_order).
requires_ownership(refund_order, order).
```

Rule:

```prolog
missing_ownership_check(Handler, Action) :-
    calls(Handler, Action),
    sensitive_action(Action),
    requires_ownership(Action, _),
    !checks(Handler, ownership).

business_logic_bug(Handler, Action, "Sensitive action without ownership check") :-
    missing_ownership_check(Handler, Action).
```

Output:

```text
business_logic_bug(
  refund_handler,
  refund_order,
  "Sensitive action without ownership check"
)
```

Trong static analysis, Datalog đã có tiền lệ mạnh:

- Doop dùng Datalog/LogiQL để mô tả pointer analysis cho Java.
- Soufflé tự mô tả là Datalog tool cho static analysis, như points-to analysis, taint analysis và security checks.
- CodeQL dùng database extracted từ code và QL là logic programming language với predicates, quantifiers, recursion và logical connectives. CodeQL không phải Datalog thuần, nhưng tư tưởng "code as queryable relational data" rất gần với hướng này.

Kết luận: MVP nên dùng Datalog hoặc một Datalog-like engine làm lõi.

## Vai trò của Knowledge Graph

`Knowledge Graph` không nhất thiết là reasoner chính. Nó phù hợp làm lớp lưu trữ tri thức và evidence.

Graph có thể lưu:

```text
Route -> Handler -> Service -> Repository -> Model
Handler -> Calls -> SensitiveAction
Handler -> Checks -> Authenticated
Handler -> MissingCheck -> Ownership
User -> Owns -> Resource
Action -> Requires -> Policy
Finding -> HasEvidence -> CodeLocation
```

Ví dụ:

```text
"/orders/:id/refund"
  HANDLED_BY -> refund_handler

refund_handler
  CALLS -> refund_order
  CHECKS -> authenticated
  MISSING_CHECK -> ownership

refund_order
  MODIFIES -> Order.status
  SENSITIVE_ACTION -> true
```

RDF mô hình hóa graph bằng triples `subject-predicate-object`. W3C RDF 1.1 định nghĩa RDF graph là tập các triples. OWL thêm ontology layer để định nghĩa class/relation phức tạp hơn. SHACL dùng để validate RDF graph theo shapes/constraints. Ba thứ này gợi ý một hướng thiết kế:

```text
RDF/KG = lưu entity và relation
OWL = định nghĩa ontology domain nếu cần classification
SHACL = validate graph constraints
Datalog = chạy rule analysis phức tạp trên facts
LLM = explain graph + findings
```

KG hữu ích cho hệ thống agentic vì agent cần memory có cấu trúc:

- Code entity memory: route, function, class, model, database table.
- Business domain memory: role, permission, workflow, state, invariant.
- Evidence memory: file, line, call path, dataflow path.
- Finding memory: rule nào match, confidence, severity, fix suggestion.
- Historical memory: finding nào đã tồn tại, đã fix, regression hay new issue.

Nếu chỉ lưu mọi thứ trong vector database, agent có semantic search tốt nhưng thiếu relation chính xác. KG giúp truy vấn quan hệ rõ ràng:

```text
Tìm tất cả endpoint gọi action refund nhưng không có ownership check.
Tìm tất cả handler modify Order.status từ client input.
Tìm tất cả sensitive action reachable từ public route.
Tìm tất cả path từ unauthenticated route tới payment operation.
```

## FOL, Prolog, Datalog, KG nên phối hợp thế nào?

Cách phân vai thực dụng:

```text
FOL
  = language để formalize invariants và threat model

Prolog
  = playground để học/prototype goal-driven reasoning

Datalog
  = production-ish core cho static analysis facts/rules

Knowledge Graph
  = persistent memory + evidence graph + domain relation layer

LLM
  = code summarizer + semantic extractor + report writer + orchestration agent
```

Architecture:

```text
                ┌────────────────────┐
                │   Source Code       │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Parser / Extractor  │
                │ AST, routes, calls  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Datalog Facts       │
                │ code_facts.dl       │
                └─────────┬──────────┘
                          │
                          ▼
┌────────────────────┐    │     ┌────────────────────┐
│ Domain Policies    │────┼────▶│ Datalog Reasoner    │
│ FOL-style rules     │    │     │ violations.csv      │
└────────────────────┘    │     └─────────┬──────────┘
                          │               │
                          ▼               ▼
                ┌────────────────────┐    ┌────────────────────┐
                │ Knowledge Graph     │◀───│ Evidence Mapper     │
                │ relations/evidence  │    │ file/line/path      │
                └─────────┬──────────┘    └────────────────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ LLM Report Agent    │
                │ explain + fix       │
                └────────────────────┘
```

## Core ontology cho dự án

Một ontology tối thiểu cho source-code business logic có thể gồm:

```text
CodeEntity
  Function
  Handler
  Route
  Middleware
  Service
  Repository
  Model
  DatabaseTable

Actor
  AnonymousUser
  AuthenticatedUser
  Admin
  Owner
  Staff

Resource
  Order
  Invoice
  Payment
  Coupon
  Account
  File

Action
  Read
  Create
  Update
  Delete
  Refund
  Approve
  Transfer
  Withdraw

Check
  AuthenticationCheck
  AuthorizationCheck
  OwnershipCheck
  RoleCheck
  StateCheck
  AmountValidation
  ApprovalCheck
  RateLimitCheck
  IdempotencyCheck

Finding
  MissingOwnershipCheck
  WorkflowBypass
  ClientControlledState
  MissingApproval
  LimitBypass
  PaymentIntegrityIssue
```

Relations:

```text
route(Route, Method, Path)
handled_by(Route, Handler)
calls(Caller, Callee)
reads(Function, Resource)
writes(Function, Resource)
modifies(Function, Field)
receives_input(Handler, Parameter)
passes_input(From, To, Parameter)
checks(Function, Check)
protects(Check, Resource)
requires(Action, Check)
performs(Function, Action)
reachable_from_public_route(Function)
has_evidence(Finding, File, Line)
```

Datalog facts có thể là materialized view từ graph hoặc parser output.

## Bug class 1: Missing ownership check

Đây là MVP tốt nhất.

Business invariant:

```text
Một user chỉ được modify resource nếu user sở hữu resource hoặc có role admin.
```

FOL:

```text
∀u∀r∀a (
  Modifies(u, r, a) →
  (Owns(u, r) ∨ HasRole(u, Admin))
)
```

Datalog abstraction:

```prolog
sensitive_write_action(update_order).
sensitive_write_action(delete_order).
sensitive_write_action(refund_order).

requires_check(update_order, ownership).
requires_check(delete_order, ownership).
requires_check(refund_order, ownership).

missing_ownership_check(Handler, Action) :-
    performs(Handler, Action),
    sensitive_write_action(Action),
    requires_check(Action, ownership),
    !checks(Handler, ownership),
    !checks(Handler, admin_role).
```

Example facts:

```prolog
route("POST", "/orders/:id/refund", refund_handler).
performs(refund_handler, refund_order).
checks(refund_handler, authenticated).
```

Finding:

```text
refund_handler performs refund_order but has no ownership/admin check.
```

Evidence cần map:

- Route.
- Handler file/line.
- Call tới sensitive action.
- Các checks đã detect.
- Check bị thiếu.

## Bug class 2: Workflow bypass

Business invariant:

```text
Order chỉ được confirm sau khi payment đã verified.
```

FOL:

```text
∀o (
  Confirmed(o) →
  PaymentVerified(o)
)
```

Datalog:

```prolog
state_transition(confirm_order, pending, confirmed).
requires_state(confirm_order, payment_verified).

workflow_bypass(Handler, Action, RequiredState) :-
    performs(Handler, Action),
    state_transition(Action, _, _),
    requires_state(Action, RequiredState),
    !checks(Handler, RequiredState).
```

Example:

```prolog
performs(confirm_handler, confirm_order).
checks(confirm_handler, authenticated).
```

Finding:

```text
confirm_handler can confirm order without checking payment_verified.
```

## Bug class 3: Client-controlled critical state

OWASP business logic/integrity testing cảnh báo không nên phụ thuộc vào hidden field, non-editable field hoặc dữ liệu client-side cho business rule. Backend phải tự kiểm tra hoặc giữ state phía server.

Invariant:

```text
Client input không được trực tiếp quyết định critical state như price, role, balance, order.status.
```

Datalog:

```prolog
critical_field(order_status).
critical_field(price).
critical_field(role).
critical_field(balance).

client_controlled_critical_state(Handler, Field) :-
    receives_input(Handler, Param),
    maps_to_field(Param, Field),
    critical_field(Field),
    writes(Handler, Field),
    !checks(Handler, server_side_validation(Field)).
```

Example:

```prolog
receives_input(update_order_handler, "status").
maps_to_field("status", order_status).
writes(update_order_handler, order_status).
```

Finding:

```text
update_order_handler writes order_status from client input without server-side validation.
```

## Bug class 4: Missing approval

Invariant:

```text
High-risk transaction cần approval trước khi execute.
```

FOL:

```text
∀t (
  HighRiskTransaction(t) ∧ Executed(t) →
  Approved(t)
)
```

Datalog:

```prolog
high_risk_action(transfer_large_amount).
high_risk_action(refund_large_amount).

requires_check(transfer_large_amount, approval).
requires_check(refund_large_amount, approval).

missing_approval(Handler, Action) :-
    performs(Handler, Action),
    high_risk_action(Action),
    requires_check(Action, approval),
    !checks(Handler, approval).
```

Finding:

```text
Handler executes high-risk action without approval check.
```

## Bug class 5: Limit/quota bypass

Invariant:

```text
Một function có usage limit phải check limit trước khi thực hiện action.
```

Datalog:

```prolog
limited_action(apply_coupon).
limited_action(request_password_reset).
limited_action(create_trial_account).

requires_check(apply_coupon, usage_limit).
requires_check(request_password_reset, rate_limit).
requires_check(create_trial_account, anti_abuse_limit).

limit_bypass(Handler, Action, Check) :-
    performs(Handler, Action),
    limited_action(Action),
    requires_check(Action, Check),
    !checks(Handler, Check).
```

Finding examples:

- Coupon apply không check số lần dùng.
- Password reset không rate limit.
- Trial creation không anti-abuse check.

## Bug class 6: Public route reaches sensitive sink

Invariant:

```text
Public route không được reach sensitive sink nếu không qua authentication/authorization.
```

Recursive Datalog rất hợp cho bài này.

Facts:

```prolog
calls(public_handler, service_a).
calls(service_a, refund_order).
sensitive_sink(refund_order).
public_route(public_handler).
checks(public_handler, none).
```

Rules:

```prolog
reachable(From, To) :-
    calls(From, To).

reachable(From, To) :-
    calls(From, Mid),
    reachable(Mid, To).

public_sensitive_reachability(Handler, Sink) :-
    public_route(Handler),
    reachable(Handler, Sink),
    sensitive_sink(Sink),
    !protected_by_authz_path(Handler, Sink).
```

Điểm cần nghiên cứu thêm là `protected_by_authz_path`. Không chỉ check ở handler, nhiều hệ thống check ở middleware hoặc service layer. Vì vậy facts phải lưu vị trí check trên path:

```prolog
path_check(Handler, Sink, authorization) :-
    reachable(Handler, Node),
    reachable(Node, Sink),
    checks(Node, authorization).
```

Rồi:

```prolog
protected_by_authz_path(Handler, Sink) :-
    path_check(Handler, Sink, authorization).
```

## Fact extraction: phần khó nhất

Reasoning chỉ tốt khi facts đủ đúng. Phase 1 nên extract ít nhưng chắc.

Với Node Express:

```javascript
router.post("/orders/:id/refund", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  await refund(order);
  res.json({ ok: true });
});
```

Facts:

```prolog
route("POST", "/orders/:id/refund", refund_handler).
middleware(refund_handler, auth).
checks(refund_handler, authenticated).
reads(refund_handler, order).
source_param(refund_handler, "req.params.id").
calls(refund_handler, "Order.findById").
calls(refund_handler, refund).
performs(refund_handler, refund_order).
```

Nếu code có:

```javascript
if (order.userId !== req.user.id) return res.status(403).end();
```

Facts:

```prolog
checks(refund_handler, ownership).
ownership_check(refund_handler, order, "order.userId", "req.user.id").
```

Nếu code có:

```javascript
if (!req.user.isAdmin) return res.status(403).end();
```

Facts:

```prolog
checks(refund_handler, admin_role).
```

LLM có thể hỗ trợ nhận diện semantic pattern như `order.userId !== req.user.id`, nhưng nên có validator để tránh LLM tự bịa fact.

## LLM nên nằm ở đâu?

Không nên dùng LLM như scanner duy nhất. Nên dùng theo 5 vai trò:

### 1. Semantic labeling

LLM giúp đặt nhãn:

```text
Function refundOrder nhiều khả năng là sensitive action refund_order.
Function approveInvoice nhiều khả năng cần approval.
Parameter price là money-sensitive.
```

Output của LLM không nên được tin ngay. Nó nên đi vào queue review hoặc confidence layer.

### 2. Weak extractor fallback

Parser có thể extract syntax chắc chắn. Nhưng business semantics đôi khi nằm trong naming, comment, docs. LLM có thể giúp tạo candidate facts:

```json
{
  "candidate_fact": "sensitive_action(refund_order)",
  "evidence": "function name refundOrder and writes Order.refundedAt",
  "confidence": 0.82
}
```

### 3. Rule authoring assistant

Người nghiên cứu mô tả policy bằng tiếng Việt/Anh:

```text
User không được refund order không thuộc về mình.
```

LLM gợi ý Datalog rule, nhưng rule phải được test.

### 4. Finding explanation

Reasoner output:

```prolog
missing_ownership_check(refund_handler, refund_order).
```

LLM convert thành report:

```text
POST /orders/:id/refund gọi refund_order nhưng chỉ có authentication check.
Không thấy ownership/admin check trên path từ route tới refund sink.
Impact: user có thể thử refund order của user khác nếu biết order id.
```

### 5. Agent orchestration

Agent quyết định bước tiếp theo:

- Parse thêm file liên quan.
- Mở controller/service/repository.
- Chạy lại rule.
- Sinh PoC request trong môi trường lab.
- Gợi ý unit test.

Nhưng decision critical như "route này an toàn" không nên chỉ dựa vào LLM.

## Evidence model

Một finding tốt cần có proof/evidence, không chỉ text.

Schema đề xuất:

```json
{
  "finding_id": "BL-OWNERSHIP-001",
  "type": "missing_ownership_check",
  "route": "POST /orders/:id/refund",
  "handler": "refund_handler",
  "sink": "refund_order",
  "missing_check": "ownership",
  "facts": [
    "route(\"POST\", \"/orders/:id/refund\", refund_handler)",
    "performs(refund_handler, refund_order)",
    "sensitive_action(refund_order)",
    "requires_check(refund_order, ownership)"
  ],
  "negative_evidence": [
    "no checks(refund_handler, ownership)",
    "no checks(refund_handler, admin_role)"
  ],
  "code_locations": [
    {
      "file": "src/routes/orders.js",
      "line": 42
    }
  ],
  "confidence": "medium",
  "needs_manual_review": true
}
```

Với logic system, `negative_evidence` phải cẩn thận. Trong Datalog/closed-world setting, thiếu fact có thể xem là false. Trong FOL/open-world setting, thiếu fact chỉ là unknown. MVP static analyzer thường dùng closed-world assumption cho facts đã extract:

```text
Nếu extractor đủ khả năng nhận diện ownership check trong scope đã phân tích,
và không thấy check,
thì flag missing check.
```

Nếu extractor chưa chắc, mark `needs_manual_review`.

## Open-world vs closed-world

Đây là quyết định semantics rất quan trọng.

FOL classical thường là open-world:

```text
Không biết Approved(x) không có nghĩa là ¬Approved(x).
```

Datalog/static analysis thường practical hơn với closed-world:

```text
Nếu facts database không có checks(handler, ownership), xem như không phát hiện ownership check.
```

Trong security scanning, closed-world assumption hữu ích để flag risk. Nhưng nó dễ false positive nếu extractor chưa đủ tốt.

Cách thiết kế cân bằng:

```text
known_check(handler, check)     # extractor chắc chắn thấy check
candidate_check(handler, check) # LLM/heuristic nghi ngờ có check
missing_check(handler, check)   # không có known_check
uncertain(handler, check)       # có candidate nhưng chưa verified
```

Rule:

```prolog
missing_required_check(Handler, Check) :-
    requires_check(Action, Check),
    performs(Handler, Action),
    !known_check(Handler, Check).

needs_review(Handler, Check) :-
    missing_required_check(Handler, Check),
    candidate_check(Handler, Check).
```

## Phân tầng confidence

Không phải finding nào cũng như nhau.

High confidence:

```text
Route public -> sensitive sink
Không có middleware auth
Không có check ở handler/service path
Sink trực tiếp modify database
```

Medium confidence:

```text
Có auth nhưng không thấy ownership
Codebase có custom auth helper chưa model đầy đủ
LLM thấy naming liên quan ownership nhưng parser chưa verify
```

Low confidence:

```text
Chỉ dựa vào function name
Không có call graph đầy đủ
Framework/dynamic dispatch chưa parse được
```

Rule có thể encode confidence:

```prolog
high_confidence_bug(Handler, Sink) :-
    public_route(Handler),
    reachable(Handler, Sink),
    sensitive_sink(Sink),
    !known_check_on_path(Handler, Sink, authentication),
    !known_check_on_path(Handler, Sink, authorization).

medium_confidence_bug(Handler, Sink) :-
    authenticated_route(Handler),
    reachable(Handler, Sink),
    sensitive_sink(Sink),
    requires_check(Sink, ownership),
    !known_check_on_path(Handler, Sink, ownership).
```

## Research direction: từ source code sang Datalog facts

Đây là phần cần đầu tư nhất.

Các extractor cần có:

### Route extractor

Extract:

```prolog
route(Method, Path, Handler).
middleware(Handler, Middleware).
```

Nguồn:

- Express routes.
- Flask decorators.
- FastAPI decorators.
- Spring annotations.
- Laravel routes.

### Call graph extractor

Extract:

```prolog
calls(Caller, Callee).
reachable(Caller, Callee).
```

Khó ở:

- Dynamic dispatch.
- Dependency injection.
- Higher-order functions.
- Framework callbacks.
- Async/event-driven code.

Phase 1 có thể làm approximate call graph.

### Data access extractor

Extract:

```prolog
reads(Function, Model).
writes(Function, Model).
modifies(Function, Field).
query_by(Function, Field).
```

Ví dụ:

```javascript
Order.findById(req.params.id)
order.status = "refunded"
await order.save()
```

Facts:

```prolog
reads(refund_handler, order).
query_by(refund_handler, order_id).
modifies(refund_handler, order_status).
writes(refund_handler, order).
```

### Check extractor

Extract:

```prolog
checks(Function, authenticated).
checks(Function, ownership).
checks(Function, role_admin).
checks(Function, payment_verified).
checks(Function, amount_limit).
```

Đây là phần dễ miss nhất vì check có nhiều dạng:

```javascript
if (!req.user) ...
if (order.userId !== req.user.id) ...
if (!canRefund(req.user, order)) ...
await policy.enforce("refund", order)
authorize(user, "refund", order)
```

Nên thiết kế registry cho auth/policy helpers:

```prolog
helper_semantics("authorize", authorization).
helper_semantics("canRefund", ownership).
helper_semantics("requireAdmin", admin_role).
```

LLM có thể gợi ý helper semantics, sau đó con người hoặc test xác nhận.

### Sink classifier

Extract:

```prolog
sensitive_action(Action).
requires_check(Action, Check).
```

Nguồn:

- Function names: refund, withdraw, approve, delete, transfer.
- Writes to critical models/fields.
- Existing docs/comments.
- API spec.
- Domain policy file.

## Knowledge graph schema

KG nên lưu nhiều hơn Datalog facts vì cần context, provenance và history.

Node types:

```text
CodeFile
Function
Route
Middleware
Model
Field
Action
Check
Policy
Finding
Evidence
UserRole
WorkflowState
```

Edges:

```text
DECLARES
HANDLES
CALLS
READS
WRITES
MODIFIES
REQUIRES
CHECKS
PROTECTS
VIOLATES
HAS_EVIDENCE
LOCATED_AT
DERIVED_FROM
```

Example graph:

```text
Route:POST /orders/:id/refund
  HANDLES -> Function:refund_handler

Function:refund_handler
  CALLS -> Function:refund_order
  CHECKS -> Check:authenticated
  LOCATED_AT -> src/routes/orders.js:42

Action:refund_order
  REQUIRES -> Check:ownership
  MODIFIES -> Field:Order.status

Finding:BL-OWN-001
  VIOLATES -> Policy:RefundRequiresOwnership
  HAS_EVIDENCE -> Function:refund_handler
```

Datalog có thể chạy từ facts exported từ KG:

```text
KG -> facts.csv -> Datalog engine -> violations.csv -> KG finding nodes
```

## MVP đề xuất

Chọn scope nhỏ:

```text
Language: Node.js Express hoặc Python Flask
Bug class: Missing ownership / authorization check
Input: 1 sample vulnerable app
Output: report có route, handler, sink, missing check, evidence
Reasoner: Datalog
LLM: giải thích + gợi ý fix
KG: optional ở phase 1, nhưng schema nên thiết kế sớm
```

MVP không cần training.

MVP cần:

1. Parse routes.
2. Parse calls đơn giản.
3. Detect middleware auth.
4. Detect sensitive actions bằng rule + naming.
5. Detect ownership checks đơn giản.
6. Generate Datalog facts.
7. Run Datalog rules.
8. Map finding về file/line.
9. LLM viết report từ structured finding.

## Folder structure gợi ý

```text
agentic-logic-scanner/
  samples/
    express-demo/
  extractor/
    route_extractor.py
    call_extractor.py
    check_extractor.py
    sink_classifier.py
  facts/
    routes.facts
    calls.facts
    checks.facts
    sinks.facts
  rules/
    ownership.dl
    workflow.dl
    client_state.dl
  reasoner/
    run_souffle.py
  graph/
    schema.md
    export_to_graph.py
  reports/
    findings.json
    report.md
```

## Example Soufflé-style rules

```prolog
.decl route(method:symbol, path:symbol, handler:symbol)
.decl calls(caller:symbol, callee:symbol)
.decl checks(fn:symbol, check:symbol)
.decl sensitive_action(action:symbol)
.decl requires_check(action:symbol, check:symbol)
.decl reachable(src:symbol, dst:symbol)
.decl violation(handler:symbol, action:symbol, reason:symbol)

.input route
.input calls
.input checks
.input sensitive_action
.input requires_check
.output violation

reachable(A, B) :-
  calls(A, B).

reachable(A, C) :-
  calls(A, B),
  reachable(B, C).

violation(Handler, Action, "missing ownership check") :-
  reachable(Handler, Action),
  sensitive_action(Action),
  requires_check(Action, "ownership"),
  !checks(Handler, "ownership"),
  !checks(Handler, "admin_role").
```

Về sau cần nâng cấp `checks(Handler, Check)` thành `check_on_path(Handler, Action, Check)` để bắt check nằm ở service/middleware.

## Evaluation plan

Không thể chỉ demo một app rồi kết luận. Cần có benchmark nhỏ.

Dataset ban đầu:

```text
10 endpoints an toàn
10 endpoints thiếu ownership
10 endpoints thiếu state check
10 endpoints client-controlled critical state
10 endpoints có custom policy helper
```

Metrics:

```text
Precision = finding đúng / tổng finding
Recall = bug tìm được / tổng bug thật
Evidence accuracy = file/line/path đúng không
Rule explainability = finding có derivation rõ không
Runtime = scan time trên codebase mẫu
Manual review load = bao nhiêu finding cần người xem lại
```

Mục tiêu phase 1:

```text
Precision cao hơn recall.
Chấp nhận bỏ sót một số bug nhưng finding phải có evidence tốt.
```

Vì nếu tool tạo quá nhiều false positive, người dùng sẽ bỏ.

## Những vấn đề nghiên cứu mở

### 1. Business semantics extraction

Làm sao biết `refundOrder` là sensitive action? Làm sao biết `canManageOrder` bao gồm ownership? Đây là chỗ LLM hữu ích nhưng cần verification.

Hướng:

```text
LLM candidate labeling + human confirmation + test cases + fact provenance.
```

### 2. Framework-aware extraction

Mỗi framework encode route/middleware/check khác nhau. Cần adapter:

```text
ExpressAdapter
FlaskAdapter
FastAPIAdapter
SpringAdapter
LaravelAdapter
```

### 3. Path-sensitive authorization

Check có thể nằm ở middleware, service, policy object, decorator, guard hoặc interceptor. Rule naive chỉ nhìn handler sẽ false positive.

Hướng:

```prolog
check_on_path(Entry, Sink, Check)
```

### 4. State machine inference

Workflow bug cần biết state machine:

```text
pending -> paid -> confirmed -> shipped -> delivered -> refunded
```

State machine có thể lấy từ:

- enum/model fields.
- transition functions.
- docs.
- tests.
- API behavior.
- LLM-assisted extraction.

### 5. Closed-world calibration

Nếu extractor không thấy check, có thật là thiếu check không? Cần confidence layer và manual review mode.

### 6. Explainability

Finding phải có derivation:

```text
route -> handler -> reachable sink -> sink requires ownership -> no ownership check on path
```

Không nên chỉ trả:

```text
Potential issue found.
```

### 7. Continuous learning without training

Phase 1 không training model nhưng vẫn có thể học từ feedback:

```text
false_positive(finding_id)
confirmed_helper_semantics(authorizeOrder, ownership)
project_policy(refund_order, requires_ownership)
```

Feedback này update facts/rules/KG, không cần train neural model.

## Roadmap

### Phase 0: Research

- Học FOL để formalize invariant.
- Học Prolog để hiểu backward chaining và negation-as-failure.
- Học Datalog để viết rules trên facts hữu hạn.
- Học RDF/OWL/SHACL/KG để thiết kế graph memory.
- Đọc CodeQL/Soufflé/Doop để học cách code trở thành queryable database.

### Phase 1: Static Datalog MVP

- Parse Express/Flask routes.
- Generate facts.
- Detect missing ownership check.
- Output JSON finding.
- LLM explain finding.

### Phase 2: Evidence graph

- Lưu code facts và findings vào KG.
- Map evidence file/line/call path.
- Query graph để gom context cho LLM.

### Phase 3: More bug classes

- Workflow bypass.
- Client-controlled state.
- Missing approval.
- Limit/quota bypass.
- Payment integrity.

### Phase 4: Agentic workflow

- Agent tự chọn extractor.
- Agent chạy reasoner.
- Agent mở evidence file.
- Agent hỏi LLM để label ambiguous semantics.
- Agent sinh report và suggested tests.

### Phase 5: Hybrid dynamic validation

- Từ finding static, sinh test hoặc PoC trong lab.
- Replay request với user A/user B.
- Confirm exploitability.

## Kết luận

Hướng này có thể tóm lại bằng một câu:

```text
Biến source code và business policy thành facts/rules,
dùng symbolic reasoning để tìm violation,
rồi dùng LLM để giải thích và điều phối.
```

FOL giúp định nghĩa logic đúng. Prolog giúp học và prototype. Datalog là ứng viên mạnh nhất cho static reasoning core. Knowledge Graph giúp lưu relation, provenance, evidence và memory cho agent. LLM giúp nối thế giới ngôn ngữ tự nhiên với thế giới logic, nhưng không nên là nơi quyết định cuối cùng.

MVP nên bắt đầu nhỏ: `missing ownership/authorization check` trên một framework web cụ thể. Nếu pipeline `code -> facts -> rules -> finding -> evidence -> explanation` chạy được, ta mới mở rộng sang workflow, payment, quota, approval và state-machine bugs.

## Tài liệu tham khảo

- [OWASP - Business Logic Vulnerability](https://owasp.org/www-community/vulnerabilities/Business_logic_vulnerability)
- [OWASP WSTG - Business Logic Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/10-Business_Logic_Testing/)
- [OWASP Top 10 for Business Logic Abuse](https://owasp.org/www-project-top-10-for-business-logic-abuse/)
- [PortSwigger - Examples of Business Logic Vulnerabilities](https://portswigger.net/web-security/logic-flaws/examples)
- [Stanford Introduction to Logic - First-Order Logic](https://logic.stanford.edu/intrologic/extras/fol.html)
- [Open Logic Project - Sets, Logic, Computation](https://slc.openlogicproject.org/)
- [Ceri, Gottlob, Tanca - What You Always Wanted to Know About Datalog](https://www.dcc.fc.up.pt/~ines/aulas/1617/PL/WhatYouAlwaysWantedtoKnowAboutDatalog_AndNeverDaredtoAsk.pdf)
- [Soufflé - A Datalog Synthesis Tool for Static Analysis](https://souffle-lang.github.io/)
- [Doop Framework 101](https://plast-lab.github.io/doop-pldi15-tutorial/)
- [CodeQL Glossary](https://codeql.github.com/docs/codeql-overview/codeql-glossary/)
- [CodeQL - Introduction to QL](https://codeql.github.com/docs/writing-codeql-queries/introduction-to-ql/)
- [ISO/IEC 13211-1:1995 Prolog](https://www.iso.org/standard/21413.html)
- [W3C RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/2014/REC-rdf11-concepts-20140225/)
- [W3C OWL 2 Web Ontology Language Overview](https://www.w3.org/TR/owl-overview/)
- [W3C SHACL Shapes Constraint Language](https://www.w3.org/TR/shacl/)
- [A Survey on Knowledge Graphs: Representation, Acquisition and Applications](https://arxiv.org/abs/2002.00388)
- [Neuro-Symbolic Artificial Intelligence: Towards Improving the Reasoning Abilities of Large Language Models](https://www.ijcai.org/proceedings/2025/1195)
- [Measuring Faithfulness in Chain-of-Thought Reasoning](https://arxiv.org/abs/2307.13702)
