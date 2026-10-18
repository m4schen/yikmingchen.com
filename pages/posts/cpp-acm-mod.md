---
title: "ACM Mode C++ Guide"
date: '2026-03-15T00:00:00Z'
lang: en
type: note
art: random
duration: 5min
description: "Short guide to the differences between ACM mode and regular LeetCode-style."
---

[[toc]]

## The Core Difference

- ACM mode need us manually handle input and output, while LeetCode-style provides a function signature and handles I/O for us. Using `while (cin >> ...)` or `for (int t = 0; t < T; t++)` or `while(a--)` is common in ACM mode to read multiple test cases.
- A single execution of an ACM mode program may need to process multiple test cases, **also we need to manually reset any global state between test cases**.

## Pro Tips

- Use `std::ios::sync_with_stdio(false);` and `std::cin.tie(nullptr);` for faster I/O in ACM mode.

- Avoid using `endl` as it flushes the output buffer; use `'\n'` instead for better performance.

- Use `scanf`/`printf` for even faster I/O if needed, but be consistent with C++ style.

## Header Files we may need

Always try the magic header `<bits/stdc++.h>` first, it includes everything and saves time during contests.

The backup is here if `bits/stdc++.h` is not available:

```cpp
#include <iostream> // for cin, cout
#include <string>   // for string manipulation
#include <vector>   // for dynamic arrays
#include <algorithm> // for sort(), max(), min(), reverse(), etc.
#include <unordered_map> // for hash maps
#include <unordered_set> // for hash sets
#include <queue>    // for queue and priority_queue
#include <stack>    // for stack
#include <cmath>    // for math functions like sqrt(), pow(), etc.

using namespace std;
```

## Debbugging Tips

Have a "Print Debugging" Macro sometimes helps:

```cpp
#define DEBUG 1 // Set to 0 to disable debug prints
void debug_print(string msg, int val) {
  if (DEBUG) {
    cout << "[DEBUG] " << msg << ": " << val << "\n";
  }
}
```

### If we are forced doing black box testing...

Here is a systematic way to check our code. Btw, don't forget to get the value from the input stream.

#### "Hidden Killers" Checklist

- Integer overflow (use long long if needed)
- Uninitialized variables
- Array out of bounds
- Global state not reset between test cases

#### Manual Test Edge Cases

against the extremes like input is 0, 1, or the maximum allowed value.

#### Stress Testing (We probably don't have time to do this)

Generate random test cases and compare the output of your code against a known correct solution (brute force or a different implementation).

## Some Useful Templates

### String & Line Templates

```cpp
int main() {
  // --- 1. Reading a single word (Stops at space) ---
  string word;
  cin >> word;

  // --- 2. Reading an entire line (Includes spaces) ---
  string line;
  // TRAP ALERT: If you used `cin >>` right before `getline`,
  // there is a leftover newline character '\n' in the buffer.
  // You MUST clear it using cin.ignore() first!
  getline(cin, line);

  // --- 3. Parsing a comma-separated string (e.g., "1,2,3,4") ---
  string input = "1,2,3,4";
  stringstream ss(input);
  string token;
  vector<int> nums;

  // Read from 'ss' into 'token' stopping at every ','
  while (getline(ss, token, ',')) {
    nums.push_back(stoi(token)); // Convert token to int and store
  }

  return 0;
}
```

### scanf/printf Template

```cpp
int main() {
  int n;
  long long bigNum;
  double decimal;
  char charArray[105]; //add some null terminator for safety

  // Reading input
  // %d (int), %lld (long long), %lf (double), %s (char array/word)
  scanf("%d %lld %lf %s", &n, &bigNum, &decimal, charArray);

  // Convert cahr array to string if needed
  string str = charArray;

  // %.2lf to print double with 2 decimal places
  printf("Int: %d, Long: %lld, Double: %.2f\n", n, bigNum, decimal);

  // TRAP ALERT: printf CANNOT output a std::string directly.
  // You MUST use .c_str() to convert it back to a C-style string.
  printf("String: %s\n", str.c_str());

  return 0;
}
```
