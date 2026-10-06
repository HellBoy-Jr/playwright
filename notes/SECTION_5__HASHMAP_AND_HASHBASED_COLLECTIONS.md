# SECTION 5 — HASHMAP AND HASH-BASED COLLECTIONS

## Topics Covered
- 5.1 Hashing Mental Model, 5.2 hashCode, 5.3 Hash Spreading, 5.4 Bucket, 5.5 Bucket Index, 5.6 Collision, 5.7 equals During Lookup, 5.8 Updating Existing Key, 5.9 Lookup Flow, 5.10 Removal Flow, 5.11 Resizing, 5.12 Load Factor, 5.13 Treeification, 5.14 Complexity, 5.15 Interview Qs, 5.16 HashSet Internals

*Built with dedicated subagent, internet-validated*

---
## 5.1 Mental Model
Node<K,V>[] table + chains. put hashes→slot→Entry; get re-hashes→scan. O(1) uniform, O(n) clustered. Null key hash 0 bucket 0. No order.
## 5.2 hashCode
Int fingerprint; equal→equal hash mandatory, stable while in map. Default identity. Mutable key mutate→get miss.
## 5.3 Spreading — Production hash()
```java
static final int hash(Object key) {
  int h; return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
// Why: power-of-two table uses (n-1)&hash → only low bits matter.
// Sequential keys 1,2,3 have poor low-bit entropy; XOR folds high bits down.
```
Triage: interview “write hash()” → null→0 + `^ >>>16`. Anti: assuming hashCode==internal hash, crypto hash confusion.
## 5.4 Bucket
table[i] head: null/single/list/TreeNode. Cap 16 pow2. Size 16 ≠ 16 used; bad hash piles in one bucket.
## 5.5 Index + 5.11 Resizing — Production
```java
int i = (table.length - 1) & hash; // fast modulo, never negative, not hash % length
// Resize: size > capacity*0.75 → double 16→32, each entry stays i or moves i+oldCap:
if ((e.hash & oldCap) == 0) loHead.add(e); else hiHead.add(e);
// 13th put into default map triggers resize (16*0.75=12). Pre-size bulk loads:
Map<String,String> m = new HashMap<>((int)(1000/0.75f)+1);
```
Triage: mass abort after JDK change → check major_version + rehash distribution; iteration order changed → expected after resize. Anti: `% n` answer, oversized table hurting `O(cap+n)` iteration.
## 5.6 Collision
Same bucket different keys → chaining, Java8 tree at threshold. Different hashes can collide when n small. Aa/BB same hashCode example.
## 5.7 equals Lookup
Hash picks bucket, equals picks node: `hash== + (key== || equals)`. Need both overridden consistently. Case-sensitive trap.
## 5.8 Update
put existing replaces value returns old, size unchanged. Counter must use merge/compute.
## 5.9 Lookup Flow
hash→index→null?null→head check→tree/linear→value/null. get null ambiguous → containsKey to disambiguate.
## 5.10 Removal
hash→traverse prev unlink size-- modCount++ return old. remove(k,v) checks value. Enhanced-for remove → CME → iterator.remove/removeIf.
## 5.11 Resizing
size>cap*LF doubles 16→32, redistributes i/i+oldCap no rehash. 13th element triggers resize (16*0.75=12). Pre-size `new HashMap<>(1000)`.
## 5.12 Load Factor
Default 0.75 tradeoff mem vs chains. High saves mem slower; low faster more mem. Iteration O(cap+n). Rarely change.
## 5.13 Treeification
len>=8 + cap>=64 → RB-tree, <=6 untreeify. Small table resizes instead. Needs Comparable else identity tie-break. Worst O(log n) mitigates DoS.
## 5.14 Complexity
Avg O(1), worst O(n) historic O(log n) modern. containsValue/values O(n), iteration O(cap+n), resize O(n) amortized. entrySet not containsValue in loop.
## 5.15 Qs
Contract? (n-1)&hash why? Null key? Fail-fast modCount? syncMap vs CHM scaling?
## 5.16 HashSet Internals
`HashMap<E,Object>` adapter `put(e,PRESENT)` dummy. Same O(1)/null/order/hash rules. Overhead Node+dummy.
