---
title: "Leetcode Template & Notes"
date: 2026-02-22T00:00:00Z
type: blog
art: random
duration: 15min
---

## General Method

**Two Pointers** for problems involving arrays (like nsum), linked lists or string. It can used in many cases like finding circles, finding intersections, deleting nodes count from the end, etc.

## Arrays

**Binary Search** for **sorted** arrays. Keep track of left and right pointers, calculate mid index, and adjust pointers based on comparison. Have many variations like finding first/last occurrence, insert position, etc.

**Sliding Window** for contiguous subarray problems. We can keep the right pointer moving and adjust the left pointer only when the window condition is violated. The key point here is how we move the left pointer.

**Prefix Sum** for range sum queries. We can precompute the prefix sums so that we can get the sum of any subarray in O(1) time.

## Linked Lists

Remember the wild pointer problem especially when we try to delete a node. We can't just delete the current node, we need a temp pointer to keep track of the next node before we delete the current node.

Cycle detection can be done using the two pointers method. Same as other insert or delete operations.

## Hash Tables

Arrays, Sets, Maps can be used as hash tables. `std::unordered_map` and `std::unordered_set` in C++ are based on hash tables. They provide average O(1) time complexity for insert, delete, and search operations.

If we use custom types as keys in `std::map`, we must define `operator<`. If we use custom types in `std::unordered_map`,we must define hash function and equality operator

## Strings

Understand STL operations and iteration patterns like `substr，split，reverse`.

KMP (Knuth-Morris-Pratt) algorithm is used for pattern matching. It preprocesses the pattern to create a longest prefix-suffix (LPS) array, which allows it to skip unnecessary comparisons when a mismatch occurs. Prefix means all substrings that start from the beginning of the pattern, and suffix means all substrings that end at the end of the pattern, (excluding the whole pattern itself). When we find a mismatch, we need to go to the previous element's LPS value to find the next position to compare. We can use the next array with LPS or LPS - 1 to find the next position to compare. we use a getNext function to preprocess the pattern and create the next array.

```c++
void getNext(int* next, const string& s){
    int j = -1;
    next[0] = j;
    for(int i = 1; i < s.size(); i++) { // from the second character
        while (j >= 0 && s[i] != s[j + 1]) { // last character no equal, if we use LPS, this is s[i] != s[j] and j > 0
            j = next[j]; // go back, if we use LPS, this is j = next[j - 1]
        }
        if (s[i] == s[j + 1]) { // same character, move j forward, if we use LPS, this is s[i] == s[j]
            j++;
        }
        next[i] = j; // length of the LPS for s[0..i]
    }
}
```

And to use the next array to find the pattern in the text, we can do like this:

```c++
int j = -1; // because we -1 for the next array, so we need to start from -1
for (int i = 0; i < s.size(); i++) {
    while(j >= 0 && s[i] != t[j + 1]) { // mismatch, if we use LPS, this is s[i] != t[j] and j > 0
        j = next[j]; // go back, if we use LPS this is j = next[j - 1]
    }
    if (s[i] == t[j + 1]) { // match, move both forward
        j++; // i in the for loop
    }
    if (j == (t.size() - 1) ) { // found a match
        return (i - t.size() + 1);
    }
}
```

## Stacks and Queues

The maximum of a sliding window - **monotonic queue**(stack)(单调堆栈) can be used to solve this problem. The key point is to maintain the order of the elements in the queue and to remove elements that are out of the current window. Each problems has its own way to maintain the queue, but the idea of designing pop and push operations is the same, we need to make sure that the queue always contains the elements that are satisfy some conditions like increasing or decreasing order, and we need to pop the elements that are out of the current window.

Priority queue can be used for top-k, merging k sorted lists, or maintaining min/max element. `priority_queue<int, vector<int>, greater<int>> pq;`. The parameters are `T, Container, Comparator(default: less<T> → max heap)`

## Trees

Three things: Traversal, Divide & Conquer, Subtree Aggregation

DFS:
Preorder -> construct / path
Inorder -> BST (sorted property)
Postorder -> compute subtree results (depth, count, balance, LCA)

BFS:
Level order -> shortest path / min depth

Common patterns:

- Property of tree = Postorder aggregation
- Tree construction = Preorder divide & conquer
- BST = Inorder ordered + directional recursion

### BST (Binary Search Tree)

For every node: left subtree < root < right subtree

Inorder traversal gives a strictly increasing sequence.

Search / insert / delete:
Use value comparison to move left or right (O(h)).

Common use:

- Validate BST → check inorder is increasing
- Closest / minimum difference → inorder + previous pointer
- LCA(Lowest Common Ancestor) → use value range

### Trie

Used for prefix search, dictionary matching, auto-complete.

Each node represents one character.
Path from root → a word prefix.

Core operations:

- insert(word)
- search(word)
- startsWith(prefix)

Time complexity: O(L) per operation (L = word length)

#### Trie vs Hash Table

Use Trie (Time: O(L)) when:

- Need prefix search (startsWith)
- Need lexicographical order
- Need to find all words with a given prefix
- Need efficient multi-pattern matching

Use Hash Table (Time: average O(1)) when:

- Only need exact match lookup
- No prefix requirement
- Space efficiency is important

Summary:
Exact match → Hash
Prefix / dictionary problems → Trie

## Backtracking

DFS + choose → recurse → undo (prune when invalid). Used for permutations / combinations / subsets.

```bash
backtrack(path, choices):
    if satisfy end condition:
        get answer from path
        return

    for choice in choices:
        make choice (add to path)
        backtrack(updated path, updated choices)
        undo
```

## Greedy

Make locally optimal choice.
Requires proof of optimal substructure. (Don't need to proof actually, try some cases to verify the greedy choice is always optimal)
Common in interval / sorting based problems.

## Dynamic Programming

Five steps to solve DP problems:

1. Define the state
   What does dp[i] or dp[i][j] represent?
2. Derive the state transition equation
   Express current state in terms of previous states.
3. Initialize base cases
   Determine the starting condition.
4. Decide iteration order
   Ensure dependent states are computed before current state.
5. Return the final result

Common transition patterns:

- Linear: `dp[i] = f(dp[i-1], ...)` Kadane's algorithm: `dp[i] = max(dp[i-1] + nums[i], nums[i])`
- Enumerate previous: `dp[i] = (max|min) (dp[j] + cost(j, i)) for j < i`
- 2D grid: `dp[i][j] = f(dp[i-1][j], dp[i][j-1])`
- Knapsack(背包问题): `dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight] + value)`
- Interval: `dp[l][r] = (min|max) (dp[l][k] + dp[k+1][r])`
- FSM (finite states): `dp[i][s] = combine(dp[i-1][s'])`
- State compression(bitmask): `dp[mask] = combine(dp[mask - subset])`

## Graph

Note: 字符串迁移也是一种图模型，字符串是节点，迁移是边。

Graph decision guide:

- Unweighted shortest path → BFS
- Weighted shortest path → Dijkstra
- Negative edge → Bellman-Ford
- Detect cycle (undirected) → Union-Find
- DAG ordering → Topological Sort
- Minimum spanning tree → Kruskal

### DFS (stack/recursion), BFS (queue)

Used for traversal, connected components, shortest path in unweighted graph.

### Union-Find

used for dynamic connectivity, need three functions: find(x), union(x, y), connected(x, y) or isSame(x, y).

Used to maintain dynamic connectivity.

find(x): return root of x (with path compression)
join(x, y): merge two sets
isSame(x, y): check if in same set

Time: almost O(1) amortized

```c++
int n = 1005; // n根据题目中节点数量而定，一般比节点数量大一点就好
vector<int> father = vector<int> (n, 0); // C++里的一种数组结构

// 并查集初始化
void init() {
    for (int i = 0; i < n; ++i) {
        father[i] = i;
    }
}
// 并查集里寻根的过程
int find(int u) {
    return u == father[u] ? u : father[u] = find(father[u]); // 路径压缩
}

// 判断 u 和 v是否找到同一个根
bool isSame(int u, int v) {
    u = find(u);
    v = find(v);
    return u == v;
}

// 将v->u 这条边加入并查集
void join(int u, int v) {
    u = find(u); // 寻找u的根
    v = find(v); // 寻找v的根
    if (u == v) return ; // 如果发现根相同，则说明在一个集合，不用两个节点相连直接返回
    father[v] = u;
}
```

### MST Problem : Kruskal

Find a tree that connects all vertices with minimum total weight.
Used when we need minimum cost to connect all components.
Kruskal’s Algorithm (MST):

1. Sort edges by weight (ascending).
2. Traverse edges from smallest to largest.
3. Add edge if it does NOT form a cycle (Union-Find).
4. Stop after adding n-1 edges.

Goal: connect all vertices with minimum total weight (no cycle).

Time: O(E log E)

```c++
struct Edge {
    int u, v, w;
};

class UnionFind {
public:
    vector<int> parent;

    UnionFind(int n) {
        parent.resize(n);
        for (int i = 0; i < n; i++)
            parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x];
    }

    bool unite(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;  // already connected
        parent[ry] = rx;
        return true;
    }
};

int kruskal(int n, vector<Edge>& edges) {
    sort(edges.begin(), edges.end(),
         [](Edge& a, Edge& b) { return a.w < b.w; });

    UnionFind uf(n);
    int mst = 0;

    for (auto& e : edges) {
        if (uf.unite(e.u, e.v))
            mst += e.w;
    }
    return mst;
}
```

### Topological Sort

Kahn's algorithm (BFS) or DFS with visited states. Used for ordering tasks with dependencies (DAG).
Repeatedly remove nodes with indegree = 0.
After removing a node, decrease the indegree of its neighbors.
If all nodes are processed → valid order.
If not → graph contains a cycle.

Time: O(V + E)

```c++
// Kahn's algorithm for topological sort
vector<int> topoSort(int n, vector<vector<int>>& graph) {
    vector<int> indegree(n, 0), result;
    queue<int> q;

    // 1. compute indegree
    for (int u = 0; u < n; u++)
        for (int v : graph[u])
            indegree[v]++;

    // 2. push nodes with indegree 0
    for (int i = 0; i < n; i++)
        if (indegree[i] == 0)
            q.push(i);

    // 3. BFS
    while (!q.empty()) {
        int u = q.front(); q.pop();
        result.push_back(u);

        for (int v : graph[u]) {
            if (--indegree[v] == 0)
                q.push(v);
        }
    }

    return result.size() == n ? result : vector<int>{}; // empty if cycle
}
```

### Dijkstra

Used for shortest path in weighted graph without negative edges. Uses a priority queue to always expand the node with the smallest tentative distance.

#### Naive Dijkstra (O(V²))

Repeatedly select the unvisited node with the smallest distance,
mark it visited, and relax its outgoing edges.

Works only for non-negative weights.

Time: O(V²)
Space: O(V²) (adjacency matrix)

#### Heap-optimized Dijkstra (O(E log V))

Use a min-heap (priority queue) to always extract the node with the smallest current distance.

Instead of scanning all vertices (O(V)),
the heap allows extraction in O(log V),
reducing total complexity to O((V + E) log V).

Works only for non-negative edge weights.
Best for sparse graphs

```c++
#include <iostream>
#include <vector>
#include <queue>
#include <limits>

using namespace std;

void dijkstra(int n, vector<vector<pair<int,int>>>& graph, int start) {
    const int INF = numeric_limits<int>::max();

    vector<int> dist(n, INF);
    dist[start] = 0;

    // min-heap: {distance, node}
    priority_queue<
        pair<int,int>,
        vector<pair<int,int>>,
        greater<pair<int,int>>
    > minHeap;

    minHeap.push({0, start});

    while (!minHeap.empty()) {
        auto [curDist, u] = minHeap.top();
        minHeap.pop();
        //cout << "POP u=" << u << " dist=" << curDist << endl;

        // Skip outdated entries because c++ don't support modify elements in priority queue
        if (curDist > dist[u]) continue;

        for (auto [v, weight] : graph[u]) {
            int newDist = dist[u] + weight;

            if (newDist < dist[v]) {
                // cout << "RELAX " << u << "->" << v << " =" << newDist << endl;
                dist[v] = newDist;
                minHeap.push({newDist, v});
            }
        }
    }

    // Print result
    for (int i = 0; i < n; i++) {
        cout << "dist[" << i << "] = " << dist[i] << endl;
    }
}
```

### Bellman_ford

Relax all edges V-1 times.

If any edge can still be relaxed in the V-th round → negative cycle exists.

Works with negative weights.
Time: O(VE)

```c++
#include <vector>
#include <limits>
using namespace std;

struct Edge {
    int u, v, w;
};

bool bellmanFord(int n, vector<Edge>& edges, int start, vector<int>& dist) {
    const int INF = numeric_limits<int>::max();
    dist.assign(n, INF);
    dist[start] = 0;

    // V-1 relaxations
    for (int i = 0; i < n - 1; i++) {
        for (auto& e : edges) {
            if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) {
                // cout << "RELAX " << e.u << "->" << e.v << endl;
                dist[e.v] = dist[e.u] + e.w;
            }
        }
    }

    // check negative cycle
    for (auto& e : edges) {
        if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) {
            return false; // negative cycle
        }
    }

    return true; // success
}
```

### Floyd

DP definition:

```bash
dp[i][j][k] = shortest distance from i to j
              using only nodes {1..k} as intermediate nodes.
```

Transition:

```bash
dp[i][j][k] =
    min(
        dp[i][j][k-1],              // do not use k
        dp[i][k][k-1] + dp[k][j][k-1] // use k
    )
```

Base case: `dp[i][j][0] = direct edge weight (or INF)`

k must be the outer loop,
because we build solutions layer by layer
by increasing allowed intermediate nodes.

Time: O(n³)
Space: O(n²) (can compress 3D into 2D)

Observation:
Each layer k only depends on layer k-1.

Therefore we can update in-place:

```bash
dist[i][j] =
min(dist[i][j],
    dist[i][k] + dist[k][j])
```

So we only need a 2D array.

```c++
#include <iostream>
#include <vector>
#include <limits>

using namespace std;

void floyd(int n, vector<vector<int>>& dist) {

    for (int k = 0; k < n; k++) {          // intermediate node
        for (int i = 0; i < n; i++) {      // start node
            for (int j = 0; j < n; j++) {  // end node

                if (dist[i][k] != INT_MAX &&
                    dist[k][j] != INT_MAX) {

                    dist[i][j] = min(
                        dist[i][j],
                        dist[i][k] + dist[k][j]
                    );
                }
            }
        }
    }
}
```
