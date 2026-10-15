---
title: "C++ STL Core Algorithms / Container "
date: 2026-02-25T00:00:00Z
type: blog
art: random
duration: 22min
---

[[toc]]

All algorithms operate on **\[begin, end)**.
Most are defined in `<algorithm>`,\
`accumulate` is defined in `<numeric>`.

## STL Containers & Underlying Structures

| Container      | Underlying Structure    | Time Complexity (Access/Search) | Notes                 |
| -------------- | ----------------------- | ------------------------------- | --------------------- |
| vector         | Dynamic Array           | O(1) random access              | contiguous memory     |
| deque          | Segmented array         | O(1) random access              | non-contiguous blocks |
| list           | Doubly linked list      | O(n) access                     | no random access      |
| forward_list   | Singly linked list      | O(n) access                     | minimal memory        |
| stack          | Adapter (deque default) | O(1) push/pop                   | LIFO                  |
| queue          | Adapter (deque default) | O(1) push/pop                   | FIFO                  |
| priority_queue | Binary heap             | O(log n) push/pop               | max-heap by default   |
| set / multiset | Red-Black Tree (BST)    | O(log n)                        | ordered               |
| map / multimap | Red-Black Tree (BST)    | O(log n)                        | key-value ordered     |
| unordered_set  | Hash Table              | O(1) avg                        | no order              |
| unordered_map  | Hash Table              | O(1) avg                        | no order              |

### vector

- Contiguous memory
- Best for binary search
- Best cache locality

### set / map

- Implemented as Red-Black (Balanced Binary Search) Tree
- Always sorted
- No random access
- lower_bound is O(log n) internally via tree traversal

### unordered_map / unordered_set

- Implemented as Hash Table

```text
bucket array (vector)
  ↓
linked nodes (separate chaining)
```

- Worst case O(n) if many collisions
- Requires hash function + equality
- Only Forward Iterator (not bidirectional)
  - Hash table has no inherent order, cannot traverse backwards (no `operator--`)
  - Bucket traversal is unidirectional
  - Rehashing invalidates iterators and may change iteration order.

### priority_queue

- Implemented as Binary Heap
- Underlying container: vector by default
- Heap property maintained via sift up/down

### Iterator Category Summary

| Container     | Iterator Type    |
| ------------- | ---------------- |
| vector        | Random Access    |
| deque         | Random Access    |
| list          | Bidirectional    |
| set/map       | Bidirectional    |
| unordered_map | Forward iterator |

## Algorithm → Container Requirements

| Algorithm             | Requires Random Access?  | Works With                 |
| --------------------- | ------------------------ | -------------------------- |
| sort                  | Yes                      | vector, deque              |
| reverse               | No                       | any bidirectional iterator |
| find / count          | No                       | any iterator               |
| lower_bound(sorted)   | Yes (efficient)          | vector, deque              |
| upper_bound(sorted)   | Yes (efficient)          | vector, deque              |
| binary_search(sorted) | Yes (efficient)          | vector, deque              |
| next_permutation      | No (needs bidirectional) | vector, deque              |
| max/min_element       | No                       | any iterator               |
| accumulate            | No                       | any iterator               |

### sort

```cpp
sort(v.begin(), v.end());
sort(v.begin(), v.end(), greater<int>());
```

Introsort (QuickSort + HeapSort fallback + InsertionSort)

Time: $O(n \log n)$ average, n square worst-case

Space: $O(\log n)$ average, $O(n)$ worst-case

```cpp
void quickSort(vector<int>& a, int l, int r) {
    if (l >= r) return;

    int pivot = a[r];
    int i = l;

    for (int j = l; j < r; j++) {
        if (a[j] < pivot) {
            swap(a[i], a[j]);
            i++;
        }
    }

    swap(a[i], a[r]);

    quickSort(a, l, i - 1);
    quickSort(a, i + 1, r);
}
```

### next_permutation

```cpp
next_permutation(v.begin(), v.end());
```

Pivot + swap + reverse suffix

Time: $O(n)$

Space: $O(1)$

```cpp
bool myNextPermutation(vector<int>& a) {
    int n = a.size();
    int i = n - 2;

    while (i >= 0 && a[i] >= a[i + 1]) i--;

    if (i < 0) {
        reverse(a.begin(), a.end());
        return false;
    }

    int j = n - 1;
    while (a[j] <= a[i]) j--;

    swap(a[i], a[j]);

    reverse(a.begin() + i + 1, a.end());

    return true;
}
```

### lower_bound

```cpp
auto it = lower_bound(v.begin(), v.end(), target);
```

Binary search

Time: $O(\log n)$

Space: $O(1)$

### upper_bound

```cpp
auto it = upper_bound(v.begin(), v.end(), target);
```

Binary search

Time: $O(\log n)$

Space: $O(1)$

### binary_search

```cpp
bool ok = binary_search(v.begin(), v.end(), target);
```

Just a wrapper around `lower_bound` that checks if the target exists.

Time: $O(\log n)$

Space: $O(1)$

```cpp
bool myBinarySearch(vector<int>& a, int target) {
    int pos = myLowerBound(a, target);
    return pos < a.size() && a[pos] == target;
}
```

### reverse

```cpp
reverse(v.begin(), v.end());
```

Symmetric swap (two pointers)

Time: $O(n)$

Space: $O(1)$

```cpp
void myReverse(vector<int>& a) {
    int l = 0, r = a.size() - 1;
    while (l < r) {
        swap(a[l++], a[r--]);
    }
}
```

### find

Linear scan

Time: $O(n)$

Space: $O(1)$

```cpp
auto it = find(v.begin(), v.end(), target);
```

### count

Linear scan

Time: $O(n)$

Space: $O(1)$

```cpp
int c = count(v.begin(), v.end(), target);
```

### max_element / min_element

```cpp
auto it = max_element(v.begin(), v.end());
auto it = min_element(v.begin(), v.end());
```

Linear scan

Time: $O(n)$

Space: $O(1)$

### accumulate

```cpp
#include <numeric>
int sum = accumulate(v.begin(), v.end(), 0);
```

Linear reduction

Time: $O(n)$

Space: $O(1)$
