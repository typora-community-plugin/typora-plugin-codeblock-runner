# Codeblock Runner

## Local

### JavaScript

```js
console.log('hello from js')
console.info({ answer: 1 + 1, type: 'object' })
console.warn('warn level')
console.error(new Error('error level'))
await new Promise(resolve => setTimeout(resolve, 200))
console.log('done after await')
```

#### Dead Loop

```js
let second = 0
while(1) {
  await new Promise((res, rej) => setTimeout(res, 1000))
  console.log(`${++second}s`)
}
```



### TypeScript

```ts
interface Point { x: number; y: number }
enum Color { Red = 'red', Blue = 'blue' }
const p: Point = { x: 1, y: 2 }
console.log(Color.Red, p.x + p.y)
```

### HTML

Inline `<script>` does not execute in the first release; this is a known limitation.

```html
<h3 style="margin:0 0 .5em">Hello HTML</h3>
<p style="color:#3b8eea">Styled by inline style inside Shadow DOM.</p>
<ul><li>item one</li><li>item two</li></ul>
<script>
  const li = document.querySelector('ul li:first-child')
  li.textContent = 'hello'
</script>
```

### Node.js

```nodejs
console.log(process.env.ProgramFiles);
```

#### Dead Loop

```node
let second = 0;
while(1) {
  await new Promise((res, rej) => setTimeout(res, 1000))
  console.log(`${++second}s`)
}
```



## Remote

### Bash

```bash
echo "hello from bash"
sum=0
for i in $(seq 1 5); do sum=$((sum + i)); done
echo "sum = $sum"
```

### C

```c
#include <stdio.h>

int main() {
    printf("hello from c\n");
    int sum = 0;
    for (int i = 1; i <= 5; i++) sum += i;
    printf("sum = %d\n", sum);
    return 0;
}
```

### C++

```cpp
#include <iostream>

int main() {
    std::cout << "hello from cpp" << std::endl;
    int sum = 0;
    for (int i = 1; i <= 5; i++) sum += i;
    std::cout << "sum = " << sum << std::endl;
    return 0;
}
```

### C#

```csharp
using System;

class Program {
    static void Main() {
        Console.WriteLine("hello from csharp");
        int sum = 0;
        for (int i = 1; i <= 5; i++) sum += i;
        Console.WriteLine($"sum = {sum}");
    }
}
```

### Crystal

```crystal
puts "hello from crystal"
puts (1..5).sum
```

### Dart

```dart
void main() {
  print('hello from dart');
  print('sum = ${[1, 2, 3, 4, 5].reduce((a, b) => a + b)}');
}
```

### Go

```go
package main

import "fmt"

func main() {
	fmt.Println("hello from go")
	sum := 0
	for i := 1; i <= 5; i++ {
		sum += i
	}
	fmt.Println("sum =", sum)
}
```

### Haskell

```haskell
main :: IO ()
main = do
  putStrLn "hello from haskell"
  print (sum [1 .. 5])
```

### Java

```java
import java.util.List;

var squares = List.of(1, 2, 3, 4, 5).stream().map(n -> n * n).toList();
System.out.println("hello from java");
System.out.println("squares = " + squares);
```

### Julia

```julia
println("hello from julia")
println("sum = ", sum(1:5))
```

### Kotlin

```kotlin
fun main() {
    println("hello from kotlin")
    val squares = (1..5).map { it * it }
    println(squares)
}
```

### Lua

```lua
print("hello from lua")
local sum = 0
for i = 1, 5 do
  sum = sum + i
end
print("sum = " .. sum)
```

### PHP

```php
<?php
$sum = 0;
for ($i = 1; $i <= 5; $i++) {
    $sum += $i;
}
echo "hello from php\n";
echo "sum = $sum\n";
```

### PowerShell

```powershell
Write-Output 'hello from powershell'
$sum = 0
1..5 | ForEach-Object { $sum += $_ }
Write-Output "sum = $sum"
```


### Python

```python
print("hello from python")
total = sum(range(1, 6))
print("sum =", total)
```

### Python 2

```python2
print "hello from python2"
print "sum =", sum(range(1, 6))
```

### R

```r
cat("hello from r\n")
cat("sum =", sum(1:5), "\n")
```

### Rust

```rust
fn main() {
    println!("hello from rust");
    let sum: i32 = (1..=5).sum();
    println!("sum = {sum}");
}
```

#### Compile Error

```rust
fn main() {
    println!("{}", missing);
}
```

### Swift

```swift
print("hello from swift")
print("sum =", (1...5).reduce(0, +))
```

### V

```v
fn main() {
	println('hello from v')
	mut sum := 0
	for i in 1 .. 6 {
		sum += i
	}
	println('sum = ${sum}')
}
```

### Zig

```zig
const std = @import("std");

pub fn main() !void {
    var buf: [64]u8 = undefined;
    var stdout = std.fs.File.stdout().writer(&buf);
    try stdout.interface.print("hello from zig\n", .{});
    try stdout.interface.flush();
}
```
