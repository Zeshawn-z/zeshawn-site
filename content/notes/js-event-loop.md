# JavaScript 事件循环

## 核心概念

JavaScript 是单线程语言，通过事件循环（Event Loop）实现异步非阻塞。

## 执行顺序

```
调用栈 → 微任务队列 → 宏任务队列
```

### 宏任务（Macrotask）
- `setTimeout` / `setInterval`
- I/O 操作
- UI 渲染

### 微任务（Microtask）
- `Promise.then/catch/finally`
- `MutationObserver`
- `queueMicrotask`

## 经典面试题

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => {
  console.log('3');
  Promise.resolve().then(() => console.log('4'));
});

console.log('5');
```

**输出：1 → 5 → 3 → 4 → 2**

> 解析：同步代码先执行（1, 5），然后清空微任务队列（3, 4），最后执行宏任务（2）。

## async/await 的执行顺序

```javascript
async function foo() {
  console.log('a');
  await bar();
  console.log('b');
}

async function bar() {
  console.log('c');
}

console.log('d');
foo();
console.log('e');
```

**输出：d → a → c → e → b**

> 解析：`await` 会暂停 async 函数的执行，将其后的代码放入微任务队列。
