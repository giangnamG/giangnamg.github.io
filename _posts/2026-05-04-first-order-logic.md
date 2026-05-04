---
layout: post
title: "First order logic"
render_with_liquid: false
categories:
  - AI Agentic
tags:
  - ai-agentic
  - first-order-logic
  - reasoning
  - knowledge-representation
source_collection: manual
---
Topics: AI Agentic, First-order logic, Reasoning

# First order logic

`First-order logic` (FOL), còn gọi là `first-order predicate logic`, là một ngôn ngữ hình thức để biểu diễn sự thật về `object`, `property`, `relation`, và các quy tắc suy luận giữa chúng. Nếu propositional logic chỉ có thể nói "P đúng" hoặc "Q sai", thì first-order logic cho phép nói những câu có cấu trúc hơn:

```text
∀x (Human(x) → Mortal(x))
Human(Socrates)
Mortal(Socrates)
```

Ý nghĩa trực giác:

- Với mọi `x`, nếu `x` là người thì `x` sẽ chết.
- `Socrates` là người.
- Suy ra `Socrates` sẽ chết.

FOL quan trọng vì nó nằm giữa hai cực:

- Đủ biểu đạt để mô hình hóa nhiều tri thức thực tế: object, quan hệ, luật, ràng buộc, quyền truy cập, trạng thái, hành động.
- Đủ hình thức để máy có thể kiểm tra suy luận, sinh proof, tìm counterexample, hoặc phát hiện mâu thuẫn.

Trong AI agentic, FOL không thay thế LLM. Nó đóng vai trò như lớp suy luận biểu tượng: giúp agent giữ tri thức có cấu trúc, kiểm tra điều kiện trước khi hành động, giải thích tại sao một kết luận đúng, và giới hạn hành vi bằng các policy có thể audit.

## FOL giải quyết vấn đề gì?

Một agent hoặc hệ thống reasoning thường phải trả lời các câu hỏi như:

- Từ các facts hiện có, kết luận nào bắt buộc đúng?
- Một plan có vi phạm policy không?
- Hai quy tắc có mâu thuẫn nhau không?
- Có tồn tại object nào thỏa điều kiện không?
- Nếu thêm một fact mới, những kết luận nào thay đổi?
- Có cách nào chứng minh goal từ knowledge base không?

FOL cung cấp ba thành phần nền tảng để trả lời:

- `Language`: ký hiệu để viết facts và rules.
- `Semantics`: cách gán ý nghĩa cho ký hiệu trong một world/model.
- `Proof system`: quy tắc để suy luận một cách cơ học.

Stanford Encyclopedia of Philosophy mô tả classical first-order logic qua ba phần này: formal language, deductive system, và model-theoretic semantics. Open Logic Project cũng dùng cấu trúc tương tự khi trình bày syntax, semantics, proof systems, completeness, compactness, Löwenheim-Skolem, và undecidability.

## Từ propositional logic đến first-order logic

Propositional logic biểu diễn mỗi mệnh đề như một atom không có cấu trúc nội bộ:

```text
P = "Socrates is human"
Q = "Socrates is mortal"
P → Q
P
Q
```

Cách này đơn giản nhưng không tái sử dụng được. Nếu có thêm Plato, Aristotle, Ada, Alan, ta phải tạo nhiều proposition riêng:

```text
HumanSocrates
HumanPlato
HumanAda
MortalSocrates
MortalPlato
MortalAda
```

FOL thay thế các proposition rời rạc bằng predicate và variable:

```text
Human(Socrates)
Human(Plato)
Human(Ada)
∀x (Human(x) → Mortal(x))
```

Một rule duy nhất áp dụng được cho mọi object trong domain. Đây là lý do FOL phù hợp với knowledge representation: nó biểu diễn pattern tổng quát thay vì chỉ lưu từng câu rời rạc.

## Thành phần cơ bản

### Domain

`Domain` hoặc `universe of discourse` là tập object mà logic đang nói đến. Ví dụ:

```text
Domain = {Socrates, Plato, Ada, Alan}
```

Trong một hệ thống agentic, domain có thể là:

- Người dùng, role, file, tool, API endpoint.
- Task, subtask, dependency, plan step.
- Host, service, credential, vulnerability.
- Document, claim, evidence, source.

FOL không tự quyết định domain là gì. Người thiết kế knowledge base phải định nghĩa domain và vocabulary.

### Constant

`Constant` đặt tên cho một object cụ thể:

```text
Socrates
Alice
File42
Tool_Search
```

Một constant không nhất thiết phải là string trong database. Nó là một symbol. Ý nghĩa thật của symbol phụ thuộc vào interpretation/model.

### Variable

`Variable` đại diện cho object bất kỳ trong domain:

```text
x
y
user
tool
```

Variable có thể bị `quantifier` ràng buộc:

```text
∀x Human(x)
∃x Admin(x)
```

Hoặc có thể là free variable trong một query:

```text
CanAccess(user, File42)
```

### Predicate

`Predicate` biểu diễn property hoặc relation. Arity là số argument của predicate:

```text
Human(x)              # unary predicate
Admin(user)           # unary predicate
Owns(user, file)      # binary predicate
CanUse(agent, tool)   # binary predicate
Between(x, y, z)      # ternary predicate
```

Predicate trả về truth value: đúng hoặc sai trong một model.

### Function

`Function symbol` ánh xạ object sang object:

```text
FatherOf(x)
OwnerOf(file)
Next(step)
```

Ví dụ:

```text
Parent(FatherOf(Alice), Alice)
```

Function làm FOL biểu đạt hơn, nhưng cũng làm reasoning khó hơn vì có thể tạo vô hạn term:

```text
Next(0)
Next(Next(0))
Next(Next(Next(0)))
```

Trong nhiều hệ thống thực tế như Datalog, người ta hạn chế hoặc loại bỏ function symbol để giữ reasoning decidable hơn.

### Logical connectives

FOL dùng các connective quen thuộc:

```text
¬P        # not P
P ∧ Q     # P and Q
P ∨ Q     # P or Q
P → Q     # if P then Q
P ↔ Q     # P iff Q
```

Trong rule engineering, `→` thường dùng để biểu diễn luật:

```text
∀u∀r ((Admin(u) ∧ Resource(r)) → CanAccess(u, r))
```

### Quantifier

FOL có hai quantifier chính:

```text
∀x P(x)   # for all x, P(x)
∃x P(x)   # exists x such that P(x)
```

Ví dụ:

```text
∀u (Admin(u) → CanApprove(u))
∃u Admin(u)
```

Nghĩa:

- Mọi admin đều có thể approve.
- Tồn tại ít nhất một admin.

Thứ tự quantifier rất quan trọng:

```text
∀x ∃y Loves(x, y)
∃y ∀x Loves(x, y)
```

Câu đầu: ai cũng yêu ít nhất một ai đó.
Câu sau: có một người được tất cả mọi người yêu.

Hai câu này khác nhau hoàn toàn.

### Equality

Nhiều hệ FOL có equality:

```text
x = y
x ≠ y
```

Equality cần các axiom hoặc rule để bảo đảm thay thế được các object bằng nhau trong predicate/function. Automated theorem prover thường phải xử lý equality bằng kỹ thuật như paramodulation hoặc superposition.

## Term, formula, sentence

`Term` là biểu thức chỉ object:

```text
x
Socrates
FatherOf(Alice)
OwnerOf(File42)
```

`Atomic formula` là predicate hoặc equality áp dụng lên term:

```text
Human(Socrates)
Owns(Alice, File42)
OwnerOf(File42) = Alice
```

`Formula` được tạo từ atomic formula bằng connective và quantifier:

```text
∀u∀f ((Owns(u, f) ∧ Public(f)) → CanRead(u, f))
```

`Sentence` là formula không còn free variable. Sentence có thể đúng hoặc sai trong một model.

Ví dụ formula có free variable:

```text
CanRead(x, File42)
```

Ví dụ sentence:

```text
∀x CanRead(x, File42)
```

## Syntax và semantics

`Syntax` chỉ nói biểu thức có viết đúng grammar hay không.
`Semantics` nói biểu thức đó đúng hay sai trong một interpretation/model.

Ví dụ syntax đúng:

```text
∀x (Human(x) → Mortal(x))
```

Nhưng để biết câu này đúng hay sai, cần một model:

```text
Domain = {Socrates, Plato, Table1}
Human = {Socrates, Plato}
Mortal = {Socrates, Plato}
```

Trong model này, câu trên đúng.

Nếu:

```text
Human = {Socrates, Plato}
Mortal = {Socrates}
```

Thì câu trên sai vì `Plato` là counterexample: `Human(Plato)` đúng nhưng `Mortal(Plato)` sai.

## Model, satisfaction, entailment

Một `model` là một interpretation làm cho một tập sentence đúng.

Nếu model `M` làm sentence `φ` đúng, viết:

```text
M ⊨ φ
```

Nếu mọi model làm toàn bộ knowledge base `Γ` đúng cũng làm `φ` đúng, viết:

```text
Γ ⊨ φ
```

Đọc là: `Γ entails φ`.

Ví dụ:

```text
Γ:
1. ∀x (Human(x) → Mortal(x))
2. Human(Socrates)

φ:
Mortal(Socrates)
```

Ta có:

```text
Γ ⊨ Mortal(Socrates)
```

Vì trong mọi model nơi hai premise đúng, conclusion cũng phải đúng.

## Proof và derivability

Semantics nói "đúng trong mọi model". Proof system nói "có thể chứng minh bằng rule".

Ký hiệu:

```text
Γ ⊢ φ
```

Đọc là: từ `Γ` có thể derive `φ` bằng proof rules.

Hai khái niệm quan trọng:

- `Soundness`: nếu `Γ ⊢ φ` thì `Γ ⊨ φ`. Chứng minh được thì thật sự entail.
- `Completeness`: nếu `Γ ⊨ φ` thì `Γ ⊢ φ`. Nếu thật sự entail thì có proof hình thức.

Đây là lý do FOL mạnh cho automated reasoning: về mặt lý thuyết, nếu một kết luận là logical consequence thì tồn tại proof hữu hạn để máy có thể tìm.

## Ví dụ suy luận cơ bản

Knowledge base:

```text
∀x (Student(x) → Person(x))
∀x (Person(x) → HasRights(x))
Student(Ada)
```

Suy luận:

```text
Student(Ada)
Student(Ada) → Person(Ada)
Person(Ada)
Person(Ada) → HasRights(Ada)
HasRights(Ada)
```

Kết luận:

```text
HasRights(Ada)
```

Ở đây agent không "đoán". Nó nối rule với fact bằng substitution `x := Ada`.

## Unification

`Unification` là kỹ thuật tìm substitution làm hai expression giống nhau.

Ví dụ:

```text
Parent(x, Alice)
Parent(Bob, y)
```

Most general unifier:

```text
{x := Bob, y := Alice}
```

Sau substitution:

```text
Parent(Bob, Alice)
```

Unification là lõi của suy luận first-order trong Prolog, backward chaining, forward chaining, và resolution. AIMA chương inference in first-order logic cũng nhấn mạnh indexing và unification để truy xuất facts/rules hiệu quả hơn trong knowledge base lớn.

## Forward chaining

`Forward chaining` là suy luận data-driven:

1. Bắt đầu từ các fact hiện có.
2. Tìm rule có premise match với facts.
3. Sinh fact mới.
4. Lặp lại đến khi không sinh được gì thêm hoặc đạt goal.

Ví dụ:

```text
Rule:
∀x (Human(x) → Mortal(x))

Fact:
Human(Socrates)

New fact:
Mortal(Socrates)
```

Forward chaining hữu ích khi:

- Có stream facts mới liên tục.
- Cần materialize toàn bộ kết luận.
- Rule dạng Horn clause hoặc definite clause.
- Hệ thống muốn phản ứng khi tri thức mới đến.

Ứng dụng:

- Rule engine.
- Datalog.
- Policy evaluation.
- Data lineage.
- Alert correlation.
- Compliance checking.

## Backward chaining

`Backward chaining` là suy luận goal-driven:

1. Bắt đầu từ query cần chứng minh.
2. Tìm rule có conclusion match với query.
3. Biến premise của rule thành subgoal.
4. Chứng minh từng subgoal.

Ví dụ query:

```text
Mortal(Socrates)?
```

Rule:

```text
Human(x) → Mortal(x)
```

Backward chaining unify `Mortal(x)` với `Mortal(Socrates)`, tạo substitution:

```text
x := Socrates
```

Subgoal:

```text
Human(Socrates)?
```

Nếu fact này có trong knowledge base, query thành công.

Backward chaining phù hợp khi:

- Có nhiều rule/fact nhưng chỉ cần trả lời một query.
- Muốn sinh proof path ngắn.
- Hệ thống dạng logic programming như Prolog.

## Horn clause và logic programming

Horn clause là một fragment của FOL trong đó mỗi clause có nhiều nhất một positive literal. Definite clause thường có dạng:

```text
Head :- Body1, Body2, Body3.
```

Tương ứng logic:

```text
Body1 ∧ Body2 ∧ Body3 → Head
```

Ví dụ Prolog-style:

```prolog
human(socrates).
mortal(X) :- human(X).

?- mortal(socrates).
```

Kết quả:

```text
true
```

Horn clauses quan trọng vì chúng là subset đủ thực dụng của FOL: ít biểu đạt hơn FOL đầy đủ nhưng reasoning thường hiệu quả hơn. ISO Prolog chuẩn hóa core language của Prolog, còn MathWorld mô tả Horn clauses như subset của first-order logic và Prolog được xây trên definite clauses/goals.

## Resolution

`Resolution` là kỹ thuật theorem proving dựa trên refutation:

1. Chuyển knowledge base và phủ định goal sang clause normal form.
2. Thêm `¬Goal` vào knowledge base.
3. Dùng resolution để sinh clause mới.
4. Nếu suy ra empty clause `□`, tức là tập clause mâu thuẫn.
5. Vì `KB ∧ ¬Goal` mâu thuẫn, suy ra `KB ⊨ Goal`.

Ví dụ:

```text
1. Human(Socrates)
2. ¬Human(x) ∨ Mortal(x)
3. ¬Mortal(Socrates)       # negated goal
```

Resolution:

```text
2 với 1, x := Socrates  => Mortal(Socrates)
Mortal(Socrates) với 3  => □
```

Suy ra:

```text
KB ⊨ Mortal(Socrates)
```

John Alan Robinson's 1965 paper về resolution principle là nền tảng lớn của automated theorem proving. TPTP hiện là thư viện benchmark quan trọng cho automated theorem proving systems, cung cấp problem library, syntax, standards input/output, và hạ tầng đánh giá prover.

## Model checking và model finding

Proof search cố chứng minh conclusion. Model finding làm việc ngược lại: tìm một model thỏa các constraint hoặc tìm counterexample.

Ví dụ kiểm tra policy có mâu thuẫn:

```text
∀u (Admin(u) → CanDelete(u))
∀u (Contractor(u) → ¬CanDelete(u))
Admin(Alice)
Contractor(Alice)
```

Từ đây suy ra:

```text
CanDelete(Alice)
¬CanDelete(Alice)
```

Knowledge base inconsistent.

Một model finder có thể báo unsatisfiable. Nếu knowledge base satisfiable, nó có thể trả về một model mẫu để kiểm tra assumption.

Trong engineering, model finding hữu ích cho:

- Tìm counterexample cho policy.
- Kiểm tra spec trước khi implement.
- Debug ontology.
- Kiểm tra consistency giữa rules.
- Sinh test case từ logical constraint.

## Decidability và giới hạn tính toán

FOL có một điểm rất quan trọng: nó `complete` nhưng không `decidable`.

Nói cẩn thận:

- Completeness: nếu một sentence valid/entailed thì tồn tại proof.
- Semi-decidability: có thể liệt kê proof; nếu sentence valid, proof search cuối cùng sẽ tìm ra.
- Undecidability: không có thuật toán tổng quát luôn dừng và trả lời đúng yes/no cho mọi sentence FOL.

Open Logic Project trình bày decision problem của FOL như sau: không tồn tại Turing machine luôn halt và trả về 1/0 tùy theo một first-order sentence có valid hay không. Validity là semi-decidable: nếu sentence valid, một máy có thể liệt kê derivations và cuối cùng tìm proof; nếu không valid, máy có thể chạy mãi.

Hệ quả thực tế:

- FOL đầy đủ rất expressive nhưng proof search có thể không kết thúc.
- Automated prover cần heuristic.
- Production systems thường dùng fragment hạn chế: Horn clauses, Datalog, description logic, guarded fragments, SMT theories, finite-domain encodings.
- Agent nên dùng FOL như tool có kiểm soát, không nên đưa arbitrary unbounded formula vào proof search rồi chờ kết quả.

## Những gì FOL làm tốt

FOL tốt khi domain cần các đặc điểm sau:

- Object và relation rõ ràng.
- Rule có dạng nếu điều kiện thì kết luận.
- Cần proof trace.
- Cần audit logic.
- Cần phát hiện mâu thuẫn.
- Cần truy vấn tri thức có cấu trúc.
- Cần suy luận tất định hơn là xác suất.

Ví dụ:

```text
∀u∀f ((Owner(u, f) ∧ NotRevoked(u, f)) → CanRead(u, f))
Owner(Alice, Report7)
NotRevoked(Alice, Report7)
CanRead(Alice, Report7)
```

Một hệ thống có thể giải thích:

```text
Alice can read Report7 because Alice owns Report7 and access has not been revoked.
```

Đây là thứ LLM thường làm không ổn định nếu chỉ dựa vào prompt. FOL giúp tách "nội dung có thể chứng minh" khỏi "ngôn ngữ tự nhiên để giải thích".

## Những gì FOL không làm tốt

FOL không phải công cụ vạn năng.

### Không có uncertainty native

FOL classical là bivalent: mỗi sentence đúng hoặc sai trong một model. Nó không biểu diễn trực tiếp:

- Xác suất.
- Độ tin cậy.
- Fuzzy truth.
- Evidence weight.

Nếu cần reasoning với uncertainty, dùng probabilistic logic, Bayesian networks, Markov logic, probabilistic programming, hoặc thêm lớp confidence bên ngoài.

### Không có default reasoning native

Trong thực tế, ta hay nói:

```text
Bird(x) normally implies CanFly(x)
```

Nhưng chim cánh cụt là exception. FOL classical là monotonic: thêm fact mới không làm mất conclusion cũ nếu knowledge base vẫn consistent.

Default reasoning và non-monotonic reasoning cần logic khác hoặc convention như negation-as-failure trong Prolog/Datalog.

### Không có time/action native

FOL có thể encode time bằng predicate:

```text
At(agent, room, t)
Before(t1, t2)
```

Nhưng temporal reasoning có thể nhanh chóng phức tạp. Nhiều hệ thống dùng temporal logic, situation calculus, event calculus, hoặc planning language riêng.

### Không quantifier over predicates

FOL quantifies over individuals, không quantifies trực tiếp over predicate/function.

FOL có thể viết:

```text
∀x Human(x)
```

Nhưng không thể viết theo nghĩa second-order chuẩn:

```text
∀P P(x)
```

Nếu cần nói về properties như object, có thể reify predicate thành individual, nhưng semantics sẽ khác second-order logic.

### Full FOL dễ làm prover kẹt

Một formula ngắn có thể tạo search space rất lớn. Function symbols, nested quantifiers, equality, và disjunction làm automated reasoning khó hơn nhiều.

## Ứng dụng trong suy luận

### Knowledge representation

FOL biểu diễn tri thức dưới dạng facts và rules:

```text
Employee(Alice)
WorksIn(Alice, SecurityTeam)
∀x (WorksIn(x, SecurityTeam) → CanAccess(x, SIEM))
```

Ứng dụng:

- Expert systems.
- Rule-based assistant.
- Knowledge graph validation.
- Domain model cho agent.
- Consistency checking.

Điểm mạnh là tri thức rõ ràng, có thể inspect, diff, test, và explain.

### Automated theorem proving

Automated theorem prover nhận axioms và conjecture:

```text
Axioms:
∀x (Human(x) → Mortal(x))
Human(Socrates)

Conjecture:
Mortal(Socrates)
```

Prover tìm proof hoặc countermodel.

Ứng dụng:

- Chứng minh theorem toán học.
- Kiểm tra properties của protocol.
- Verify specification.
- Reasoning trong ontology.
- Benchmark hệ thống proof search qua TPTP.

TPTP cung cấp một problem library và common format để đánh giá ATP systems, giúp kết quả prover có thể so sánh và reproduce.

### Logic programming

Prolog và Datalog dùng các fragment kiểu Horn clause:

```prolog
parent(bob, alice).
parent(alice, charlie).
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).
```

Query:

```prolog
?- ancestor(bob, charlie).
```

Logic programming phù hợp khi ta muốn viết "what is true" thay vì từng bước imperative "how to compute".

Ứng dụng:

- Rule engine.
- Static analysis.
- Query recursive graph.
- Policy engine.
- Compiler analysis.
- Program analysis.

### Databases và query languages

Relational database chịu ảnh hưởng mạnh từ logic:

- Tuple relational calculus có flavor first-order.
- SQL query có thể xem là biểu thức logic trên relation.
- Datalog là logic programming language cho database recursive query.

Ví dụ Datalog:

```prolog
reachable(X, Y) :- edge(X, Y).
reachable(X, Y) :- edge(X, Z), reachable(Z, Y).
```

Ứng dụng:

- Transitive closure.
- Dependency graph.
- Access graph.
- Attack path analysis.
- Data lineage.

### Semantic Web và ontology reasoning

OWL 2 là ngôn ngữ ontology của W3C để mô tả individuals, classes, và relations. W3C OWL 2 Overview nói Direct Semantics tương thích với model-theoretic semantics của SROIQ description logic, một fragment của first-order logic có tính chất tính toán hữu ích. OWL reasoners dùng semantics này để trả lời các query như:

- Class consistency.
- Subsumption: class này có là subclass của class kia không?
- Instance retrieval: object nào thuộc class nào?
- Implicit knowledge: tri thức nào suy ra từ ontology dù không ghi trực tiếp?

Ví dụ:

```text
∀x (SecurityTool(x) → Software(x))
Nmap is a SecurityTool
Nmap is Software
```

Trong ontology, rule và class axiom giúp hệ thống infer classification tự động.

### Planning và agent action

Một agent cần biết:

- Action nào hợp lệ?
- Precondition có thỏa không?
- Action làm thay đổi world như thế nào?
- Goal đã đạt chưa?

FOL-style representation:

```text
At(agent, room1, t0)
Connected(room1, room2)
∀a∀r1∀r2∀t ((At(a, r1, t) ∧ Connected(r1, r2)) → CanMove(a, r2, t))
```

Query:

```text
CanMove(agent, room2, t0)?
```

Trong planning thực tế, ta thường dùng PDDL, situation calculus, event calculus, hoặc logic chuyên biệt. Nhưng nền tảng vẫn là biểu diễn trạng thái, điều kiện, hành động và hậu quả bằng predicate/rule.

### Policy reasoning và guardrails

FOL rất hợp với policy vì policy cần rõ ràng, kiểm tra được, và giải thích được.

Ví dụ policy cho agent dùng tool:

```text
∀a∀t ((Agent(a) ∧ Tool(t) ∧ Approved(a, t)) → CanUse(a, t))
∀a∀t ((Tool(t) ∧ Dangerous(t) ∧ ¬HasHumanApproval(a, t)) → ¬CanUse(a, t))
Agent(Codex)
Tool(DeleteFile)
Dangerous(DeleteFile)
¬HasHumanApproval(Codex, DeleteFile)
```

Kết luận:

```text
¬CanUse(Codex, DeleteFile)
```

Một guardrail dựa trên logic có thể trả lời:

```text
Action denied because DeleteFile is dangerous and there is no human approval.
```

Lưu ý engineering: nếu dùng open-world semantics, thiếu fact `HasHumanApproval` không đồng nghĩa với `¬HasHumanApproval`. Nếu muốn closed-world behavior, phải thiết kế convention rõ ràng hoặc dùng logic programming/negation-as-failure phù hợp.

### Security reasoning và attack path analysis

Trong security, FOL/Datalog-style reasoning rất hữu ích để nối facts thành attack path:

```text
HasCredential(attacker, user1)
CanLogin(user1, host1)
HasVuln(host1, PrivEsc)
∀u∀h ((HasCredential(attacker, u) ∧ CanLogin(u, h)) → HasAccess(attacker, h))
∀a∀h ((HasAccess(a, h) ∧ HasVuln(h, PrivEsc)) → CanEscalate(a, h))
```

Kết luận:

```text
HasAccess(attacker, host1)
CanEscalate(attacker, host1)
```

Ứng dụng:

- Attack graph.
- Exposure management.
- IAM policy analysis.
- Cloud permission reasoning.
- Detection correlation.

### Formal verification

FOL và các fragment của nó xuất hiện trong verification:

- Precondition/postcondition.
- Hoare logic.
- Invariant.
- SMT solving với quantifiers.
- Model checking kết hợp constraint solving.

Ví dụ invariant:

```text
∀balance (balance ≥ 0)
```

Hoặc policy:

```text
∀u∀r (CanDelete(u, r) → Admin(u))
```

Verification tool có thể cố chứng minh invariant luôn giữ, hoặc tìm counterexample.

### Natural language understanding

Một câu tự nhiên có thể được map sang FOL-like form:

```text
"Every admin can approve invoices."
∀x (Admin(x) → CanApproveInvoice(x))
```

Ứng dụng:

- Semantic parsing.
- Question answering trên knowledge base.
- Text-to-query.
- Claim checking.

LLM có thể giúp extract candidate facts/rules từ text, nhưng FOL layer giúp kiểm tra consistency và query một cách deterministic hơn.

## FOL trong AI agentic

Một agentic system thường có ba lớp:

- `Perception/input layer`: nhận text, logs, files, API response.
- `Reasoning layer`: giữ state, facts, rules, goals, constraints.
- `Action layer`: gọi tool, viết file, gửi request, tạo plan.

FOL có thể nằm ở reasoning layer.

### Pattern 1: Structured memory

Thay vì lưu memory chỉ bằng text:

```text
Alice owns repo payments-api. Bob is on security team.
```

Agent lưu facts:

```text
Owns(Alice, payments_api)
MemberOf(Bob, security_team)
```

Sau đó query:

```text
CanApprove(Bob, payments_api)?
```

Rules:

```text
∀u∀repo ((MemberOf(u, security_team) ∧ Sensitive(repo)) → CanReview(u, repo))
∀u∀repo ((Owns(u, repo)) → CanApprove(u, repo))
```

### Pattern 2: Plan validation

Agent đề xuất plan:

```text
Step1: ReadLogs(prod)
Step2: DeleteTempFiles(prod)
Step3: RestartService(prod)
```

Policy facts:

```text
Production(prod)
Destructive(DeleteTempFiles)
RequiresApproval(RestartService)
NoApproval(ticket123)
```

Rules:

```text
∀s∀env ((Step(s) ∧ Destructive(s) ∧ Production(env) ∧ NoApproval(ticket123)) → Blocked(s))
∀s∀env ((Step(s) ∧ RequiresApproval(s) ∧ NoApproval(ticket123)) → Blocked(s))
```

Query:

```text
∃s Blocked(s)?
```

Nếu có step blocked, agent phải dừng hoặc xin approval.

### Pattern 3: Tool-use authorization

Tool calling cần guardrail rõ:

```text
AllowedTool(SearchWeb)
AllowedTool(ReadFile)
DangerousTool(DeleteFile)
```

Rules:

```text
∀t (DangerousTool(t) → RequiresExplicitApproval(t))
∀a∀t ((Requests(a, t) ∧ RequiresExplicitApproval(t) ∧ ¬Approved(a, t)) → Deny(a, t))
```

Điểm quan trọng: FOL giúp tách quyết định policy khỏi natural language prompt. Prompt có thể bị prompt injection, còn policy logic có thể được kiểm thử bằng unit tests và counterexamples.

### Pattern 4: Explainable reasoning

Nếu agent trả lời:

```text
"Không thể dùng tool X."
```

Người dùng sẽ hỏi: tại sao?

FOL proof trace có thể trả lời:

```text
1. DangerousTool(X)
2. ∀t (DangerousTool(t) → RequiresExplicitApproval(t))
3. RequiresExplicitApproval(X)
4. ¬Approved(agent, X)
5. ∀a∀t ((Requests(a,t) ∧ RequiresExplicitApproval(t) ∧ ¬Approved(a,t)) → Deny(a,t))
6. Deny(agent, X)
```

Đây là khả năng giải thích có cấu trúc, không chỉ là văn bản thuyết phục.

## Open-world vs closed-world assumption

FOL classical thường đi với `open-world assumption`: không biết `P` đúng không có nghĩa là `P` sai.

Ví dụ knowledge base:

```text
Human(Alice)
```

Không có fact:

```text
Admin(Alice)
```

Ta không được kết luận:

```text
¬Admin(Alice)
```

Trong database hoặc Prolog, nhiều hệ dùng `closed-world assumption`: nếu không chứng minh được fact thì xem như false. Đây là `negation as failure`.

Ví dụ Prolog-style:

```prolog
can_read(User, File) :- owns(User, File), not(revoked(User, File)).
```

Nếu không có `revoked(alice, report7)`, hệ sẽ cho phép. Điều này thực dụng nhưng khác FOL classical.

Khi dùng logic cho agent, phải quyết định rõ:

- Thiếu evidence là unknown hay false?
- Fact nào được xem là complete?
- Nguồn dữ liệu nào authoritative?
- Có cần explicit negative facts không?

## Thiết kế knowledge base thực tế

### Bước 1: Chọn vocabulary nhỏ

Đừng bắt đầu bằng ontology quá lớn. Chọn predicate cần cho câu hỏi thật:

```text
User(u)
Role(u, r)
Resource(x)
Owns(u, x)
CanRead(u, x)
CanWrite(u, x)
RequiresApproval(action)
```

Vocabulary tốt là vocabulary trả lời được query cần thiết.

### Bước 2: Tách facts, rules, queries

Facts:

```text
User(Alice)
Role(Alice, Admin)
Resource(Report7)
Owns(Alice, Report7)
```

Rules:

```text
∀u∀r ((Role(u, Admin) ∧ Resource(r)) → CanRead(u, r))
∀u∀r (Owns(u, r) → CanWrite(u, r))
```

Queries:

```text
CanRead(Alice, Report7)?
CanWrite(Alice, Report7)?
```

Tách ba phần này giúp test dễ hơn.

### Bước 3: Hạn chế fragment

Nếu cần production reasoning, cân nhắc:

- Horn clauses nếu rule engine/Prolog-style đủ dùng.
- Datalog nếu cần recursive query nhưng muốn finite database semantics.
- Description logic/OWL nếu cần ontology classification.
- SMT nếu cần arithmetic, arrays, bitvectors, strings.
- Finite model finding nếu domain nhỏ và cần counterexample.

Không nên dùng full FOL nếu bài toán thực tế có fragment tốt hơn.

### Bước 4: Kiểm thử rules như code

Viết test case:

```text
Given:
  Admin(Alice)
  Resource(Report7)
Expect:
  CanRead(Alice, Report7)
```

Counterexample test:

```text
Given:
  Contractor(Bob)
  Sensitive(Report7)
  ¬Approved(Bob, Report7)
Expect:
  ¬CanRead(Bob, Report7)
```

Rule sai thường không crash. Nó suy luận sai. Vì vậy cần test.

### Bước 5: Log proof hoặc derivation

Trong agentic workflow, conclusion không đủ. Cần trace:

```text
CanRead(Alice, Report7)
because:
1. Admin(Alice)
2. Resource(Report7)
3. ∀u∀r ((Admin(u) ∧ Resource(r)) → CanRead(u, r))
```

Trace giúp debug và audit.

## Ví dụ đầy đủ: reasoning policy cho AI agent

Giả sử một agent muốn gọi tool `RunShellCommand`.

Facts:

```text
Agent(Codex)
Tool(RunShellCommand)
Tool(ReadFile)
Dangerous(RunShellCommand)
Safe(ReadFile)
Requests(Codex, RunShellCommand)
TaskRequires(ReadRepo, ReadFile)
CurrentTask(ReadRepo)
```

Rules:

```text
∀a∀t ((Agent(a) ∧ Tool(t) ∧ Safe(t) ∧ Requests(a, t)) → Allowed(a, t))

∀a∀t ((Agent(a) ∧ Tool(t) ∧ Dangerous(t) ∧ Requests(a, t) ∧ ¬Approved(a, t)) → Denied(a, t))

∀task∀tool ((CurrentTask(task) ∧ TaskRequires(task, tool)) → Requests(Codex, tool))
```

Nếu không có:

```text
Approved(Codex, RunShellCommand)
```

Trong classical FOL, thiếu `Approved` không đủ để suy ra `¬Approved`. Vì vậy nếu muốn deny, ta cần explicit negative fact:

```text
¬Approved(Codex, RunShellCommand)
```

Khi đó:

```text
Denied(Codex, RunShellCommand)
```

Nhưng `ReadFile` được allow:

```text
Requests(Codex, ReadFile)
Safe(ReadFile)
Allowed(Codex, ReadFile)
```

Lesson:

- FOL giúp formalize policy.
- Nhưng semantics của absence phải được thiết kế rõ.
- Agent không nên tự suy diễn "không thấy approval" thành "approval false" nếu hệ thống chưa định nghĩa closed-world.

## FOL và LLM: dùng chung thế nào?

LLM mạnh ở:

- Hiểu ngôn ngữ tự nhiên.
- Gợi ý vocabulary.
- Extract candidate facts.
- Viết explanation dễ hiểu.
- Tạo plan sơ bộ.

FOL mạnh ở:

- Kiểm tra entailment.
- Kiểm tra consistency.
- Tìm counterexample.
- Enforce rules.
- Sinh proof trace.

Một architecture thực dụng:

```text
Natural language input
        ↓
LLM extracts candidate facts/rules
        ↓
Validation layer normalizes symbols and checks schema
        ↓
FOL/Datalog/SMT reasoner checks entailment and consistency
        ↓
Agent acts only if policy query passes
        ↓
LLM explains proof trace in natural language
```

Điểm mấu chốt: LLM không nên là nguồn truth duy nhất cho policy-critical reasoning. LLM nên làm interface và translator; reasoner nên làm phần kiểm chứng.

## Common pitfalls

### Predicate quá mơ hồ

Predicate như:

```text
Good(x)
Important(x)
Safe(x)
```

thường không đủ precise. Hãy thay bằng predicate có tiêu chí rõ hơn:

```text
PassedStaticAnalysis(x)
HasHumanApproval(x)
ContainsPII(x)
RunsInProduction(x)
```

### Lẫn rule và fact

Fact:

```text
Admin(Alice)
```

Rule:

```text
∀x (Admin(x) → CanApprove(x))
```

Đừng encode rule dưới dạng text fact:

```text
Rule1("Admins can approve")
```

Trừ khi bạn có parser/reasoner riêng cho text đó.

### Không kiểm soát equality

Nếu `Alice`, `alice`, `user_123`, và email cùng chỉ một người, cần identity mapping:

```text
Alice = user_123
Email(user_123, "alice@example.com")
```

Nếu không, reasoner sẽ xem chúng là symbols khác nhau.

### Quên consistency

FOL classical có nguyên lý explosion: từ mâu thuẫn có thể suy ra mọi thứ trong logic cổ điển.

Nếu KB có:

```text
CanAccess(Alice, Secret)
¬CanAccess(Alice, Secret)
```

Thì hệ thống phải phát hiện inconsistency, không nên tiếp tục dùng conclusion một cách mù quáng.

### Dùng full FOL khi Datalog đủ

Nếu bài toán là facts hữu hạn + recursive rules, Datalog thường dễ triển khai, dễ tối ưu và predictable hơn full FOL.

## Checklist khi áp dụng FOL cho reasoning

- Xác định query thật cần trả lời.
- Thiết kế domain và vocabulary tối thiểu.
- Viết facts từ nguồn authoritative.
- Viết rules nhỏ, test từng rule.
- Quyết định open-world hay closed-world.
- Tránh function symbols nếu không cần.
- Tránh nested quantifier phức tạp khi production latency quan trọng.
- Dùng fragment decidable nếu có thể.
- Chạy consistency check định kỳ.
- Lưu proof trace hoặc explanation path.
- Tách reasoning layer khỏi LLM text generation.

## Kết luận

First-order logic là nền tảng của suy luận biểu tượng: nó cho phép biểu diễn tri thức bằng object, relation, function, quantifier và rule; sau đó kiểm tra conclusion bằng proof hoặc model semantics.

Trong AI agentic, FOL hữu ích nhất khi dùng để làm lớp kiểm chứng và policy reasoning: agent có thể dùng LLM để đọc hiểu và giao tiếp, nhưng dùng logic để quyết định điều gì được phép, điều gì suy ra được, và tại sao. Điểm phải cẩn thận là FOL đầy đủ không decidable, nên hệ thống thực tế thường dùng fragment như Horn clauses, Datalog, description logic, hoặc SMT để đạt hiệu năng và khả năng dự đoán tốt hơn.

Nếu dùng đúng, FOL biến reasoning từ "nghe có vẻ hợp lý" thành "có thể chứng minh hoặc phản bác".

## Tài liệu tham khảo

- [Stanford Introduction to Logic - First-Order Logic](https://logic.stanford.edu/intrologic/extras/fol.html)
- [Stanford Encyclopedia of Philosophy - Classical Logic](https://plato.stanford.edu/archives/sum2022/entries/logic-classical/index.html)
- [Open Logic Project - Sets, Logic, Computation](https://slc.openlogicproject.org/)
- [Open Logic Project - First-order Logic PDF](https://builds.openlogicproject.org/content/first-order-logic/first-order-logic.pdf)
- [Open Logic Project - Undecidability PDF](https://builds.openlogicproject.org/content/turing-machines/undecidability/undecidability.pdf)
- [Artificial Intelligence: A Modern Approach, 4th US ed.](https://aima.cs.berkeley.edu/)
- [AIMA - Inference in First-Order Logic](https://aima.cs.berkeley.edu/4th-ed/pdfs/newchap09.pdf)
- [W3C OWL 2 Web Ontology Language Overview](https://www.w3.org/TR/owl-overview/)
- [W3C OWL 2 Primer](https://www.w3.org/TR/2009/WD-owl2-primer-20090421/)
- [TPTP Problem Library for Automated Theorem Proving](https://tptp.org/TPTP/)
- [ISO/IEC 13211-1:1995 Prolog](https://www.iso.org/standard/21413.html)
- [Wolfram MathWorld - Horn Clause](https://mathworld.wolfram.com/HornClause.html)
