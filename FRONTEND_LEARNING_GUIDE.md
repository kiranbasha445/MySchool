# MySchool — Frontend: Build From Scratch, Brick by Brick

> **How to use this guide**
> Each brick = read the concept → write the code → run it in the browser → verify it works → answer the interview questions.
> Never move to the next brick until the current one works and you understand WHY it works.
> Write every line yourself. No copy-paste. Reading code is not the same as writing code.

---

## Stack Used in This Project (exact — do not deviate)

| Package | Version |
|---------|---------|
| Node.js | **20+** |
| React | **18.3** |
| TypeScript | **~6.0** |
| Vite | **8.x** |
| react-router-dom | **6.30** |
| axios | **1.15** |

---

# BRICK 1 — The Frontend Toolchain

**What you're building:** A running Vite + React app that shows "Hello" in the browser.

**Concept learned:** What Vite does, what npm does, what the dev server is, why we use TypeScript.

---

### The Concept

**Browser reality:** Browsers only understand three things — HTML, CSS, and JavaScript. Nothing else. React, TypeScript, JSX — the browser has never heard of these. A build tool transforms your developer-friendly code into something the browser can run.

**npm (Node Package Manager):** Like NuGet for .NET but for JavaScript. Packages are declared in `package.json`. Running `npm install` downloads everything into `node_modules/`.

**Vite:** The build tool and dev server. Two things it does:
1. **Dev mode** (`npm run dev`) — starts a local server, watches your files, and hot-reloads the browser instantly when you save. TypeScript + JSX are transformed on the fly.
2. **Build mode** (`npm run build`) — compiles everything into optimised plain HTML/CSS/JS files in a `dist/` folder for deployment.

**TypeScript:** JavaScript with type annotations. The browser cannot run TypeScript — Vite strips the types and converts it to JavaScript before the browser sees it. The benefit: TypeScript catches bugs at compile time that JavaScript would only show you at runtime.

**JSX:** A syntax extension that lets you write HTML-like code inside JavaScript. `<div className="card">` in a `.tsx` file gets compiled to `React.createElement('div', { className: 'card' })`.

---

### Write This

```bash
# In the myschool-frontend/ directory, start the dev server:
npm install       # installs all packages from package.json
npm run dev       # starts Vite dev server, usually at http://localhost:5173
```

Open [myschool-frontend/src/main.tsx](myschool-frontend/src/main.tsx) and read it:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This is the entry point. `createRoot` finds the `<div id="root">` in `index.html` and mounts your entire React app inside it. `StrictMode` runs extra checks in development only.

---

### Verify It Works

```
http://localhost:5173
```
You should see the MySchool landing page. Edit any `.tsx` file, save it — the browser updates without a full page refresh. That is Vite's HMR (Hot Module Replacement).

---

### Interview Questions

- What does `npm install` do? Where do the packages go?
- What does Vite do in development mode vs build mode?
- Why can't the browser run TypeScript directly?
- What is JSX? What does it compile to?
- What is `index.html` for? What is `<div id="root">`?

---

# BRICK 2 — HTML & CSS: The Language of the Browser

**What you're building:** Understanding the visual structure of the project without touching React yet.

**Concept learned:** Box model, Flexbox, CSS variables, class-based styling.

---

### The Concept

**HTML** defines structure. Every visible element is a "box". The browser lays them out.

**CSS Box Model:** Every HTML element has four layers around its content:
```
┌─────────────────────────────┐
│           Margin            │  ← space outside the border
│  ┌───────────────────────┐  │
│  │        Border         │  │  ← visible line
│  │  ┌─────────────────┐  │  │
│  │  │    Padding      │  │  │  ← space inside the border
│  │  │  ┌───────────┐  │  │  │
│  │  │  │  Content  │  │  │  │
│  │  │  └───────────┘  │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Flexbox:** The most important CSS layout tool. When you add `display: flex` to a parent, its children line up in a row (by default). Key properties:
- `flex-direction: column` — stack children vertically
- `justify-content: space-between` — spread children along the main axis
- `align-items: center` — centre children on the cross axis
- `gap: 16px` — space between children

**CSS Variables (Custom Properties):** Defined with `--` prefix, used with `var()`. This project uses them extensively for the colour theme:

```css
:root {
  --primary: #4f46e5;       /* indigo for buttons */
  --sidebar-bg: #1e1b4b;    /* dark navy sidebar */
  --text-muted: #94a3b8;    /* grey for secondary text */
  --border: #e2e8f0;        /* light grey borders */
}
```

Any element can then do `color: var(--primary)` and if you change the variable, every element updates.

---

### Write This

Open [myschool-frontend/src/index.css](myschool-frontend/src/index.css) — this is the project's design system. Find these sections and understand them:

1. `:root` block — all CSS variables (colours, spacing, border-radius)
2. `.app-layout` — `display: flex` with sidebar + main area
3. `.sidebar` — `display: flex; flex-direction: column` to stack logo, user, nav, footer
4. `.btn`, `.btn-primary` — the button styles
5. `.card` — the white box used everywhere in the app
6. `.stat-card` — the dashboard stat boxes

As a practice exercise (no code to submit), open DevTools (F12 in the browser), click on any element in the app, and read the Styles panel on the right. Understand which CSS rule makes it look the way it does.

---

### Verify It Works

In the browser, open DevTools → Elements → hover over the sidebar. You should see:
- `display: flex`
- `flex-direction: column`
- `background: var(--sidebar-bg)` resolving to the dark navy colour

---

### Interview Questions

- What is the CSS box model? Name its four layers.
- What does `display: flex` do to a container?
- What is `justify-content` vs `align-items`?
- What is a CSS custom property (variable)? How do you define and use one?
- What is the difference between `padding` and `margin`?

---

# BRICK 3 — JavaScript Essentials You Must Know for React

**What you're building:** Understanding the JavaScript patterns used throughout this project.

**Concept learned:** `const`/`let`, arrow functions, destructuring, array methods, async/await, ES modules.

---

### The Concept

React code is just JavaScript with extra syntax. Before React makes sense, these patterns must feel automatic.

**`const` and `let`:** Never use `var`. Use `const` when the value won't be reassigned, `let` when it will.
```js
const name = 'Ahmed';       // cannot reassign
let count = 0;              // can reassign: count = 1
count = 1;                  // OK
name = 'Sara';              // ERROR
```

**Arrow functions:**
```js
// Old way
function add(a, b) { return a + b; }

// Arrow function
const add = (a, b) => a + b;

// Arrow function with body
const add = (a, b) => {
  const result = a + b;
  return result;
};
```

**Destructuring:**
```js
// Object destructuring — pull properties out by name
const user = { name: 'Ahmed', role: 'Teacher' };
const { name, role } = user;   // name = 'Ahmed', role = 'Teacher'

// Array destructuring — pull items out by position
const [first, second] = [10, 20];  // first = 10, second = 20

// In React, useState returns an array — this is why we write:
const [count, setCount] = useState(0);
```

**Spread operator (`...`):**
```js
// Copy an object and change one field — used heavily in React state updates
const user = { name: 'Ahmed', role: 'Teacher' };
const updated = { ...user, role: 'Principal' };
// updated = { name: 'Ahmed', role: 'Principal' }

// Copy an array and add an item
const nums = [1, 2, 3];
const more = [...nums, 4];  // [1, 2, 3, 4]
```

**Array methods — the three you'll use every day:**
```js
const students = [
  { id: 1, name: 'Ahmed', score: 85 },
  { id: 2, name: 'Sara',  score: 45 },
  { id: 3, name: 'Zara',  score: 90 },
];

// .map() — transform every item, returns a new array of the same length
const names = students.map(s => s.name);
// ['Ahmed', 'Sara', 'Zara']

// .filter() — keep items that match a condition
const passing = students.filter(s => s.score >= 50);
// [{ id: 1, name: 'Ahmed', score: 85 }, { id: 3, name: 'Zara', score: 90 }]

// .find() — returns the first matching item (or undefined)
const ahmed = students.find(s => s.name === 'Ahmed');
// { id: 1, name: 'Ahmed', score: 85 }
```

**Async/await and Promises:** Every API call in this project uses this pattern.
```js
// A Promise = "a value that will be ready in the future"
// async/await = cleaner syntax for working with Promises

// Old way (Promise chain)
API.get('/Students')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// Modern way (async/await)
async function fetchStudents() {
  try {
    const response = await API.get('/Students');
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
```

**ES Modules (import/export):**
```js
// Named export — can have many per file
export const helper = () => {};
export interface User { name: string; }

// Default export — one per file
export default function MyComponent() {}

// Importing
import MyComponent from './MyComponent';          // default import
import { helper } from './utils';                 // named import
import MyComponent, { helper } from './module';   // both
```

---

### Write This

Open your browser console (F12 → Console) and type these yourself — do not just read them:

```js
// 1. Array methods
const nums = [5, 12, 8, 130, 44];
const doubled = nums.map(n => n * 2);
const big = nums.filter(n => n > 10);
console.log(doubled, big);

// 2. Object spread
const user = { name: 'Ahmed', age: 20 };
const updated = { ...user, age: 21 };
console.log(user, updated);  // user is NOT changed

// 3. Destructuring
const { name, age } = updated;
const [first, , third] = [10, 20, 30];  // skip second
console.log(name, age, first, third);
```

---

### Interview Questions

- What is the difference between `const` and `let`? When do you use each?
- What does the spread operator (`...`) do to an object? To an array?
- What does `.map()` return? What does `.filter()` return?
- What is a Promise? What does `await` do?
- What is the difference between a named export and a default export?

---

# BRICK 4 — TypeScript Basics

**What you're building:** Understanding why every file is `.tsx` and what the type annotations mean.

**Concept learned:** Type annotations, interfaces, generics, union types, optional fields.

---

### The Concept

TypeScript adds a type system on top of JavaScript. The types exist only during development — they disappear at runtime (after Vite compiles them away). Their only job is to catch mistakes before the browser sees the code.

**Basic annotations:**
```ts
// Variable types
const name: string = 'Ahmed';
const age: number = 20;
const isActive: boolean = true;

// Array types
const scores: number[] = [85, 90, 72];
const names: string[] = ['Ahmed', 'Sara'];

// Function parameter and return types
function add(a: number, b: number): number {
  return a + b;
}
```

**Interfaces — the most important TypeScript feature for this project:**
An interface describes the shape of an object — what fields it has and what type each field is.
```ts
// From myschool-frontend/src/types/index.ts
interface Student {
  id: number;
  name: string;
  profileImage?: string;  // ? means optional — can be undefined
  classId: number;
  className: string;
  marksCount: number;
  averageScore: number | null;  // | null means it can be null
}

// Now TypeScript knows exactly what a Student looks like:
const student: Student = {
  id: 1,
  name: 'Ahmed',
  classId: 2,
  className: 'Grade 5',
  marksCount: 10,
  averageScore: 87.5,
  // profileImage is optional — fine to omit
};

student.name;        // TypeScript knows this is a string ✓
student.badField;    // ERROR: property 'badField' does not exist ✗
```

**Generics — types as parameters:**
```ts
// Without generics, API.get() returns type 'any' — TypeScript can't help you
API.get('/Students')

// With a generic, you tell TypeScript what type the response data will be
API.get<Student[]>('/Students')
// Now response.data is typed as Student[] — autocomplete and error checking work
```

**Union types:**
```ts
// A value that can be one of several specific strings
type Role = 'Principal' | 'Teacher' | 'Student' | 'Parent';
// TypeScript will reject any string that isn't one of these four

// Union with null
const score: number | null = null;  // valid
```

**Type assertions (`as`):**
```ts
// When you know the type but TypeScript doesn't:
const raw = localStorage.getItem('user');  // TypeScript thinks this is string | null
const user = JSON.parse(raw) as AuthUser;  // you're telling TypeScript "trust me, it's AuthUser"
```

---

### Write This

Open [myschool-frontend/src/types/index.ts](myschool-frontend/src/types/index.ts) and read every interface. For each one, answer:
1. What does this represent in the real world?
2. Which fields are optional (`?`) and which are required?
3. Which fields can be `null`?

Then open [myschool-frontend/src/utils/auth.ts](myschool-frontend/src/utils/auth.ts) and read:
```ts
export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};
```
This function returns either an `AuthUser` or `null`. The ternary `raw ? ... : null` means: "if `raw` is truthy (not null, not empty string), parse it; otherwise return null".

---

### Verify It Works

In any `.tsx` file in the project, try deliberately making a type mistake:
```ts
const student: Student = { id: "not-a-number", ... };
// Vite/TypeScript will show a red underline immediately in VS Code
```

---

### Interview Questions

- What is the difference between TypeScript and JavaScript?
- What is an interface? How is it different from a class?
- What does `?` mean on a property? What does `| null` mean?
- What is a generic (`<T>`)? Give an example from this project.
- What does `as AuthUser` do? When would you use it?

---

# BRICK 5 — React Components and Props

**What you're building:** The mental model for how React builds UIs.

**Concept learned:** What a component is, how props work, JSX rules.

---

### The Concept

**React's core idea:** Your UI is a tree of components. Each component is a function that returns JSX. React calls these functions and builds the actual DOM.

```
App
├── BrowserRouter
│   └── Routes
│       ├── Route: Landing
│       ├── Route: Login
│       ├── Route: Dashboard
│       │   └── Layout
│       │       ├── aside.sidebar (nav items)
│       │       └── div.main-area
│       │           └── ... (page content)
│       └── ...
```

**A component is just a function that returns JSX:**
```tsx
// The simplest possible component
function Greeting() {
  return <div>Hello, World!</div>;
}

// With a prop
function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}

// Usage
<Greeting name="Ahmed" />
```

**JSX rules — the ones that trip beginners:**

1. **Return a single root element** — wrap multiple elements in `<>` (Fragment) if needed
```tsx
// WRONG
return (
  <h1>Title</h1>
  <p>Text</p>
);

// RIGHT
return (
  <>
    <h1>Title</h1>
    <p>Text</p>
  </>
);
```

2. **`className` not `class`** — `class` is a reserved word in JavaScript
```tsx
<div className="card">   // React/JSX
<div class="card">       // regular HTML
```

3. **JavaScript in JSX uses `{}`**
```tsx
const score = 85;
return <span>{score}%</span>;  // renders: 85%
```

4. **`null` and `false` render nothing** — used to conditionally show elements
```tsx
{isLoggedIn && <Dashboard />}  // shows Dashboard only if isLoggedIn is true
{error ? <ErrorMsg /> : null}  // shows nothing if no error
```

**Props:** Data passed from parent to child. Props are read-only inside the child — a child can never modify its own props.

```tsx
// Parent passes data
<AddStudentModal
  classes={classes}           // passes an array
  onClose={() => setShowModal(false)}  // passes a function
  onSaved={() => { setShowModal(false); fetchAll(); }}
/>

// Child receives and uses it
function AddStudentModal({
  classes,
  onClose,
  onSaved,
}: {
  classes: Class[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // classes, onClose, onSaved are now available here
}
```

The `children` prop is special — it represents whatever JSX is nested inside your component:
```tsx
// Layout receives children
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <aside>sidebar...</aside>
      <div className="main-area">
        {children}   {/* whatever the page passes */}
      </div>
    </div>
  );
}

// Usage:
<Layout>
  <Dashboard />   {/* this becomes children inside Layout */}
</Layout>
```

---

### Write This

Open [myschool-frontend/src/components/Layout.tsx](myschool-frontend/src/components/Layout.tsx) and trace:
1. What props does `Layout` accept?
2. Where does it render `{children}`?
3. How does `navByRole` decide which nav items to show?

Then open [myschool-frontend/src/pages/Dashboard.tsx](myschool-frontend/src/pages/Dashboard.tsx) and find:
1. How many components are defined in this file? (`Dashboard`, `StaffDashboard`, `StudentDashboard`)
2. What props does `StaffDashboard` receive?
3. Where is `<Layout>` used and what is passed as `children`?

---

### Interview Questions

- What is a React component? What must it return?
- What is the difference between props and state?
- Why do we use `className` instead of `class` in JSX?
- What is a Fragment (`<>`) and why do we need it?
- Can a child component modify its own props? Why not?

---

# BRICK 6 — useState: Making Components Remember Things

**What you're building:** Understanding how React manages UI state.

**Concept learned:** useState hook, re-renders, immutable state updates.

---

### The Concept

A regular JavaScript variable inside a function is recreated every time the function runs. It cannot "remember" a value between calls. `useState` solves this — it stores a value that persists between renders and triggers a re-render when it changes.

```tsx
import { useState } from 'react';

function Counter() {
  // useState(initialValue) returns [currentValue, setterFunction]
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

**The render cycle:**
1. Component renders → `count` is 0, button appears
2. User clicks button → `setCount(1)` is called
3. React re-renders the component → `count` is now 1
4. The new JSX replaces the old DOM (React figures out the minimum changes needed)

**Immutability rule — never mutate state directly:**
```tsx
// WRONG — React won't detect this change and won't re-render
students.push(newStudent);
setStudents(students);

// RIGHT — give React a new array
setStudents([...students, newStudent]);

// WRONG — mutating an object in state
user.name = 'Sara';
setUser(user);

// RIGHT — spread to create a new object
setUser({ ...user, name: 'Sara' });
```

**Updating state based on previous state** — use the function form of the setter:
```tsx
// WRONG when updates might batch
setCount(count + 1);

// RIGHT — guaranteed to have the latest value
setCount(prev => prev + 1);

// Real example from Attendance.tsx:
setRows(prev => prev.map(r =>
  r.studentId === studentId ? { ...r, status } : r
));
// For every row: if it's the student we want, create a new object with updated status
// Otherwise, keep the row unchanged
```

**Multiple state variables:**
```tsx
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [showModal, setShowModal] = useState(false);
```

Each is independent. Calling `setLoading(false)` only triggers one re-render for that state change (React batches updates in modern versions).

---

### Write This

Open [myschool-frontend/src/pages/Students.tsx](myschool-frontend/src/pages/Students.tsx).

Find every `useState` call and for each one write down:
1. What is the initial value?
2. What TypeScript type does it hold?
3. Where is the setter called? What triggers it?

Then trace the `filtered` variable:
```tsx
const filtered = students.filter(
  (s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.className.toLowerCase().includes(search.toLowerCase())
);
```
This is not state — it's a derived value computed on every render. When `search` state changes → re-render → `filtered` is recalculated → the table shows different rows. No extra state needed.

---

### Interview Questions

- Why can't you use a regular JavaScript variable to track UI state in React?
- What does `useState` return? Why is it an array and not an object?
- Why must you never mutate state directly?
- What is the functional update form of `setState`? When do you need it?
- What happens when you call a state setter? What does React do?

---

# BRICK 7 — useEffect: Reacting to Changes and Fetching Data

**What you're building:** Understanding how to load data from the API when a page mounts.

**Concept learned:** useEffect, dependency array, cleanup, the data-fetching pattern.

---

### The Concept

`useEffect` runs code **after** React renders. It is the place for:
- Fetching data from an API
- Setting up event listeners
- Starting timers
- Any "side effect" that isn't about rendering UI

```tsx
useEffect(() => {
  // This code runs after the component renders
  fetchData();
}, [dependency1, dependency2]);
```

**The dependency array controls WHEN the effect runs:**

| Dependency Array | When It Runs |
|---|---|
| Missing (no array) | After every render — almost never what you want |
| `[]` (empty array) | Once, after the first render only — like "on mount" |
| `[value]` | After first render, and again whenever `value` changes |
| `[a, b]` | After first render, and whenever `a` or `b` changes |

**The standard data-fetching pattern used in every page of this project:**
```tsx
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  API.get<Student[]>('/Students')
    .then((res) => setStudents(res.data))
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);  // [] = run once when component mounts
```

Step by step:
1. Component mounts → `students = []`, `loading = true` → shows spinner
2. `useEffect` fires → `API.get('/Students')` starts (async, non-blocking)
3. Response arrives → `.then()` runs → `setStudents(data)` triggers re-render
4. `.finally()` always runs → `setLoading(false)` → spinner disappears

**Fetching when a dependency changes** — from [Attendance.tsx](myschool-frontend/src/pages/Attendance.tsx):
```tsx
useEffect(() => {
  if (!classId || tab !== 'mark') return;  // guard: don't fetch if not ready
  setLoadingRows(true);
  API.get<AttendanceRow[]>('/Attendance', { params: { classId, date } })
    .then(r => setRows(r.data))
    .catch(console.error)
    .finally(() => setLoadingRows(false));
}, [classId, date, tab]);  // re-fetch whenever class, date, or tab changes
```

When the teacher changes the date → `date` state changes → re-render → dependency array sees `date` changed → effect runs again → new data is fetched.

**Fetching multiple endpoints in parallel** — `Promise.all`:
```tsx
useEffect(() => {
  Promise.all([
    API.get<Student[]>('/Students'),
    API.get<Class[]>('/Classes'),
  ])
    .then(([studentsRes, classesRes]) => {
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```
`Promise.all([p1, p2])` fires both requests simultaneously and waits for both to finish. Much faster than calling them sequentially.

---

### Write This

Open [myschool-frontend/src/pages/Marks.tsx](myschool-frontend/src/pages/Marks.tsx) and find the `useEffect`. Answer:
1. What is in the dependency array? What does that mean?
2. What happens if the API call fails?
3. When does `setLoading(false)` run?

Then open [myschool-frontend/src/pages/Attendance.tsx](myschool-frontend/src/pages/Attendance.tsx) and find the three `useEffect` calls. For each one:
1. What does it fetch?
2. What triggers it to re-run?

---

### Interview Questions

- What does `useEffect` do? When does it run?
- What is the difference between `useEffect(() => {}, [])` and `useEffect(() => {})`?
- What does `Promise.all([p1, p2])` do? Why is it better than awaiting them sequentially?
- Why is data fetching done inside `useEffect` and not directly in the component body?
- What is the loading state pattern? Why do we need a `loading` boolean?

---

# BRICK 8 — React Router: Navigation Without Page Reloads

**What you're building:** Understanding how the app navigates between pages without a full browser refresh.

**Concept learned:** BrowserRouter, Routes, Route, NavLink, useNavigate, useParams, protected routes.

---

### The Concept

Traditional websites reload the entire page when you click a link. React apps use **client-side routing** — the JavaScript intercepts navigation, swaps out components, and updates the URL without a network request.

**The structure in [App.tsx](myschool-frontend/src/App.tsx):**
```tsx
<BrowserRouter>        // Provides routing context to all children
  <Routes>             // Looks at the current URL and renders the matching Route
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={
      <ProtectedRoute>   // Guard: redirects to /login if not authenticated
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="*" element={<Navigate to="/" replace />} />  // catch-all
  </Routes>
</BrowserRouter>
```

**`<Link>` and `<NavLink>`:**
```tsx
import { Link, NavLink } from 'react-router-dom';

// Link — basic navigation
<Link to="/login">Go to Login</Link>

// NavLink — same as Link but adds an `active` class when the URL matches
<NavLink
  to="/dashboard"
  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
>
  Dashboard
</NavLink>
```

This is exactly how the sidebar in [Layout.tsx](myschool-frontend/src/components/Layout.tsx) highlights the current page.

**`useNavigate` — programmatic navigation:**
```tsx
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    await API.post('/Auth/login', credentials);
    navigate('/dashboard');  // redirect after successful login
  };
}
```

**`useParams` — reading URL parameters:**
```tsx
// Route: <Route path="/classes/:id" element={<ClassRoom />} />
// URL:   /classes/42

function ClassRoom() {
  const { id } = useParams();  // id = "42" (always a string)
}
```

**ProtectedRoute — the auth guard:** Open [myschool-frontend/src/components/ProtectedRoute.tsx](myschool-frontend/src/components/ProtectedRoute.tsx):
```tsx
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```
- `isAuthenticated()` checks if there's a token in `localStorage`
- If no token → redirect to `/login`
- If token exists → render the protected page
- `replace` means the redirect replaces the current history entry (so the back button doesn't loop)

---

### Write This

Open [myschool-frontend/src/App.tsx](myschool-frontend/src/App.tsx). For every route:
1. Is it public or protected?
2. What component does it render?
3. Which routes use URL parameters?

Then open [myschool-frontend/src/components/Layout.tsx](myschool-frontend/src/components/Layout.tsx) and trace `navByRole`. Answer:
1. How does the sidebar know which links to show?
2. How does `NavLink` know which link is "active"?
3. What happens when you click "Sign out"? Trace the code step by step.

---

### Interview Questions

- What is client-side routing? How is it different from traditional page navigation?
- What is the difference between `<Link>` and `<NavLink>`?
- What does `useNavigate()` return? When do you use it instead of `<Link>`?
- What does `useParams()` return? What types are the values?
- How does `ProtectedRoute` work? What happens if you're not logged in?
- What does `replace` do on a `<Navigate>` component?

---

# BRICK 9 — Axios: Talking to the Backend API

**What you're building:** Understanding how every API call in this project works.

**Concept learned:** Axios instance, interceptors, Bearer tokens, error handling.

---

### The Concept

`fetch` is the built-in browser API for HTTP requests. `axios` is a library that wraps it with nicer syntax, automatic JSON parsing, and interceptors.

**The Axios instance** — open [myschool-frontend/src/api/axios.ts](myschool-frontend/src/api/axios.ts):
```ts
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api'
});
```

`axios.create()` creates a configured instance. `baseURL` means every request using this `API` object automatically prepends the base URL:
```ts
API.get('/Students')
// → GET https://your-api.com/api/Students
```

`import.meta.env.VITE_API_URL` reads from a `.env` file. In production it would be the real server URL. In development, `?? '/api'` falls back to `/api`, which Vite proxies to the backend.

**Request interceptor — attaching the JWT token:**
```ts
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});
```

Every request passes through this function before being sent. It reads the JWT from `localStorage` and adds it as an `Authorization` header. The backend's `[Authorize]` attribute reads this header to know who you are.

**Response interceptor — handling 401 Unauthorized:**
```ts
API.interceptors.response.use(
  (res) => res,     // success: pass through unchanged
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';  // force redirect
    }
    return Promise.reject(err);  // re-throw so caller can also handle it
  }
);
```

If the token expires and the server returns 401, this automatically clears the stored auth data and redirects to login. Every page benefits from this without any extra code.

**Making requests:**
```ts
// GET
const res = await API.get<Student[]>('/Students');
const students = res.data;  // Student[]

// GET with query params
const res = await API.get<AttendanceRow[]>('/Attendance', {
  params: { classId: 3, date: '2026-04-26' }
});
// URL becomes: /Attendance?classId=3&date=2026-04-26

// POST
await API.post('/Students', { name: 'Ahmed', classId: 2 });

// DELETE
await API.delete(`/Marks/${id}`);
```

---

### Write This

Open [myschool-frontend/src/pages/Login.tsx](myschool-frontend/src/pages/Login.tsx) and find:
```tsx
const res = await API.post<LoginResponse>('/Auth/login', form);
localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.user));
navigate('/dashboard');
```

Trace this step by step:
1. `form` is `{ email: string, password: string }`
2. `API.post<LoginResponse>` sends `POST /api/Auth/login` with the form as JSON body
3. The request interceptor fires — but there's no token yet, so it skips adding the header
4. Server validates credentials and returns `{ token: '...', user: { id, name, role, ... } }`
5. `res.data.token` is the JWT, stored in `localStorage`
6. `res.data.user` is the user object, stored as a JSON string
7. `navigate('/dashboard')` redirects the browser

---

### Interview Questions

- What does `axios.create()` do? Why use it instead of plain `axios.get()`?
- What is an interceptor? Name the two types in this project and what each does.
- What is `Bearer` authentication? Where is the token stored and how does it get sent?
- What happens in this project when the server returns a 401 response?
- What does `import.meta.env.VITE_API_URL` do? How is it different from `process.env`?

---

# BRICK 10 — The Login Page: Forms, State, and Async Submission

**What you're building:** A deep understanding of the most common React pattern — a form.

**Concept learned:** Controlled inputs, form submission, async error handling, loading states.

---

### The Concept

**Controlled inputs** — in React, form inputs should be controlled by state. The input's `value` is always a state variable, and `onChange` updates that state.

```tsx
const [email, setEmail] = useState('');

<input
  value={email}              // value IS the state
  onChange={(e) => setEmail(e.target.value)}  // state updates on every keystroke
/>
```

If you remove the `value` prop, the input becomes "uncontrolled" — React doesn't know what's in it. Controlled is the React way.

**The full Login page pattern** — open [myschool-frontend/src/pages/Login.tsx](myschool-frontend/src/pages/Login.tsx):

```tsx
// 1. Form state as one object
const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });

// 2. A single handleChange function for all inputs
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setError('');  // clear error when user starts typing
  setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  //              ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Spread previous state, then override ONE field by its `name` attribute
  // [e.target.name] is computed property key — evaluates the variable
  // If name="email", this becomes { ...prev, email: 'newValue' }
};

// 3. Form submission — always async, always with try/catch
const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();  // stop browser's default form submit (page reload)
  
  // Validate before hitting the server
  if (!form.email || !form.password) {
    setError('Please enter your email and password.');
    return;
  }
  
  setLoading(true);
  try {
    const res = await API.post<LoginResponse>('/Auth/login', form);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    navigate('/dashboard');
  } catch (err: unknown) {
    // Extract error message from server response
    const e = err as { response?: { data?: { message?: string } } };
    setError(e.response?.data?.message ?? 'Invalid email or password.');
  } finally {
    setLoading(false);  // always re-enable the button
  }
};
```

**The `?.` (optional chaining) operator:**
```ts
e.response?.data?.message
```
This reads `message` only if both `response` and `data` exist. If `response` is undefined (network error — no response at all), this returns `undefined` instead of throwing. The `??` (nullish coalescing) then provides the fallback: `'Invalid email or password.'`

---

### Write This

Open [myschool-frontend/src/pages/ForgotPassword.tsx](myschool-frontend/src/pages/ForgotPassword.tsx) and [myschool-frontend/src/pages/ResetPassword.tsx](myschool-frontend/src/pages/ResetPassword.tsx). For each one:
1. What state variables are used?
2. What API endpoint is called?
3. What happens after success?
4. What error handling is in place?

Then trace the `handleChange` function in Login.tsx yourself with an example:
- Input: name="email", current value="", user types "a"
- What does `e.target.name` equal?
- What does `e.target.value` equal?
- What does `setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))` produce?

---

### Interview Questions

- What is a controlled input? How is it different from an uncontrolled input?
- What does `e.preventDefault()` do on a form submit event?
- What is the `?.` optional chaining operator? Give an example of when it prevents an error.
- What is the `??` nullish coalescing operator? How is it different from `||`?
- Why do we use `[e.target.name]` (computed property) instead of hardcoding the field name?

---

# BRICK 11 — The Dashboard Page: Conditional Rendering by Role

**What you're building:** Understanding how one page shows completely different UI to different users.

**Concept learned:** Conditional rendering patterns, role-based UI, multiple components in one file.

---

### The Concept

The Dashboard page has three different views:
- **Principal/Teacher** → stats grid + top students table
- **Student/Parent** → simple welcome card with instructions

Open [myschool-frontend/src/pages/Dashboard.tsx](myschool-frontend/src/pages/Dashboard.tsx):

```tsx
export default function Dashboard() {
  const user = getUser();
  const role = user?.role ?? 'Student';  // default to Student if somehow null

  return (
    <Layout>
      <header className="top-header">...</header>
      <div className="page-content">
        {role === 'Principal' || role === 'Teacher'
          ? <StaffDashboard role={role} />
          : <StudentDashboard />}
      </div>
    </Layout>
  );
}
```

The ternary operator (`condition ? A : B`) is the main conditional rendering tool in JSX.

**The `StaffDashboard` sub-component:**
```tsx
function StaffDashboard({ role }: { role: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<DashboardStats>('/Dashboard/stats')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!stats)  return null;  // error state — show nothing

  return (
    <>
      <div className="stats-grid">...</div>
      {role === 'Principal' && stats.topStudents.length > 0 && (
        <div className="card">
          {/* Top students — only shown to Principal, not Teacher */}
        </div>
      )}
    </>
  );
}
```

**Early return pattern** — instead of deeply nesting JSX inside conditions, return early:
```tsx
if (loading) return <Spinner />;
if (error)   return <ErrorMessage />;
if (!data)   return null;

// Now we know: not loading, no error, data exists
return <TheActualUI data={data} />;
```

**`&&` short-circuit rendering:**
```tsx
{role === 'Principal' && stats.topStudents.length > 0 && <TopStudentsCard />}
```
JavaScript evaluates `A && B` left to right. If `A` is false, it stops and returns `A` (which renders nothing). If `A` is true, it returns `B` (which renders the component).

---

### Write This

Open [myschool-frontend/src/pages/Dashboard.tsx](myschool-frontend/src/pages/Dashboard.tsx) and find:
```tsx
{stats.topStudents.map((s, i) => (
  <div key={s.id} className="top-student-row">
    <div className={`top-student-rank rank-${i + 1}`}>{i + 1}</div>
    ...
  </div>
))}
```

Answer these:
1. What does `.map()` do to the `topStudents` array?
2. What is `key={s.id}` for? (This is very important — look it up if unsure)
3. What is template literal syntax `` `rank-${i + 1}` ``?
4. What is `i` in `.map((s, i) => ...)` ?

---

### Interview Questions

- What are the three ways to conditionally render something in React JSX?
- What is the "early return" pattern and why is it better than deeply nested conditions?
- Why does React require a `key` prop when rendering lists with `.map()`?
- What does `user?.role ?? 'Student'` do if `user` is null?
- What is the difference between a page component and a sub-component within it?

---

# BRICK 12 — The Students Page: Tables, Search, and Modals

**What you're building:** The most complete CRUD pattern in the project.

**Concept learned:** Derived state, table rendering, search filtering, modal pattern, passing callbacks as props.

---

### The Concept

Open [myschool-frontend/src/pages/Students.tsx](myschool-frontend/src/pages/Students.tsx).

**Three-state UI pattern:**
```tsx
{loading ? (
  <Spinner />
) : filtered.length === 0 ? (
  <EmptyState />
) : (
  <Table rows={filtered} />
)}
```
Every list page in this project follows this same pattern: loading → empty → data.

**Derived state vs stored state:**
```tsx
// BAD — storing filtered results as state (causes bugs, double state)
const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

// GOOD — compute it on every render from stored state
const filtered = students.filter(
  (s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.className.toLowerCase().includes(search.toLowerCase())
);
```
`filtered` is derived — it always reflects the current `students` and `search`. You never need to update it separately.

**The modal pattern:**
```tsx
// Parent controls visibility
const [showModal, setShowModal] = useState(false);

// Parent renders modal conditionally
{showModal && canEdit && (
  <AddStudentModal
    classes={classes}
    onClose={() => setShowModal(false)}     // callback: hide modal
    onSaved={() => {                         // callback: hide + refresh
      setShowModal(false);
      fetchAll();
    }}
  />
)}
```

The modal is a separate component that does NOT control its own visibility. The parent does. When the modal is done (saved or cancelled), it calls the callback prop that the parent gave it. The parent then updates its own state.

**`fetchAll` as a reusable function:**
```tsx
const fetchAll = () => {
  Promise.all([...])
    .then(...)
    .finally(() => setLoading(false));
};

useEffect(() => { fetchAll(); }, []);  // on mount

// After saving a student, re-fetch to show the updated list
onSaved={() => { setShowModal(false); fetchAll(); }}
```

Putting fetch logic in a named function (not inline in `useEffect`) lets you call it from multiple places.

---

### Write This

Open `AddStudentModal` inside [Students.tsx](myschool-frontend/src/pages/Students.tsx) and trace:
1. What state does the modal have?
2. What validation does `handleSave` do before calling the API?
3. What does `e.stopPropagation()` on the modal `div` do? (Hint: look at `onClick` on the overlay)
4. What does `onSaved()` do after a successful save?

---

### Interview Questions

- What is derived state? Why is it better than keeping filtered results in state?
- What is the modal pattern? Which component controls the modal's visibility?
- What is `e.stopPropagation()` and why is it needed on the modal container?
- What does `Promise.all` return? In what order are the results?
- Why is `fetchAll` defined as a regular function instead of inline in `useEffect`?

---

# BRICK 13 — The Marks Page: Delete with Confirmation

**What you're building:** Understanding delete operations and the `confirm()` dialog.

**Concept learned:** Delete flow, confirmation, immediate UI update vs re-fetch.

---

### The Concept

Open [myschool-frontend/src/pages/Marks.tsx](myschool-frontend/src/pages/Marks.tsx).

**Delete with confirmation:**
```tsx
const handleDelete = async (id: number) => {
  if (!confirm('Delete this mark?')) return;  // browser confirm dialog
  await API.delete(`/Marks/${id}`);
  fetchAll();  // re-fetch the full list to reflect the deletion
};
```

`confirm()` is a browser built-in that shows a dialog and returns `true` (OK) or `false` (Cancel). It blocks the browser — not ideal for production apps (custom modals are better), but fine for admin tools.

**Template literal for dynamic URLs:**
```tsx
API.delete(`/Marks/${id}`)
// Backtick strings (template literals) can embed ${expressions}
// If id = 42, this becomes: API.delete('/Marks/42')
```

**Score bar — visual representation of a number:**
```tsx
<div className="score-bar-track">
  <div
    className={`score-bar-fill ${scoreClass(m.score)}`}
    style={{ width: `${m.score}%` }}  // dynamic inline style
  />
</div>
```

`scoreClass(85)` returns `'high'`, giving class `score-bar-fill high` which the CSS colours green. The `width` is a dynamic inline style — `style={{ width: '85%' }}`. In JSX, `style` takes an object (not a string), and property names are camelCase (`backgroundColor` not `background-color`).

---

### Write This

Open [myschool-frontend/src/utils/auth.ts](myschool-frontend/src/utils/auth.ts) and read `scoreClass`:
```tsx
export const scoreClass = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
};
```

This is a pure function (no side effects, same input always gives same output). Understand:
1. What TypeScript type does it return? (Union of string literals)
2. What score is needed for `'high'`? `'medium'`? `'low'`?
3. Where else is this function used in the codebase?

---

### Interview Questions

- What does `confirm()` return? What are its limitations in production apps?
- What is a template literal? How is it different from string concatenation?
- What is the difference between `className` and `style` in React?
- Why re-fetch the full list after a delete instead of removing the item from state locally?
- What does `async/await` look like for a `DELETE` request that returns no body?

---

# BRICK 14 — The Attendance Page: Complex State and Tab Switching

**What you're building:** Understanding the most complex page in the project.

**Concept learned:** Multiple useEffect with dependencies, tab-based UI, bulk state updates.

---

### The Concept

Open [myschool-frontend/src/pages/Attendance.tsx](myschool-frontend/src/pages/Attendance.tsx).

This page has more state than any other — count them:
```tsx
const [tab, setTab] = useState<Tab>('mark');          // which tab is active
const [classes, setClasses] = useState<Class[]>([]);   // dropdown options
const [classId, setClassId] = useState<number | ''>('');
const [date, setDate] = useState(toDateInput(new Date()));
const [rows, setRows] = useState<AttendanceRow[]>([]);
const [loadingRows, setLoadingRows] = useState(false);
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
const [summary, setSummary] = useState<AttendanceSummaryRow[]>([]);
const [loadingSummary, setLoadingSummary] = useState(false);
```

**Three useEffect calls with different triggers:**
1. `[]` — load classes once on mount
2. `[classId, date, tab]` — reload attendance rows when class, date, or tab changes
3. `[classId, tab]` — reload summary when class or tab changes

**Guard clauses in effects:**
```tsx
useEffect(() => {
  if (!classId || tab !== 'mark') return;  // don't run if not ready
  // ... fetch
}, [classId, date, tab]);
```
Even though `tab` is a dependency, the effect guards against running when the wrong tab is active.

**Bulk state update with `.map()`:**
```tsx
const setStatus = (studentId: number, status: AttendanceStatus) => {
  setSaved(false);
  setRows(prev => prev.map(r =>
    r.studentId === studentId ? { ...r, status } : r
  ));
};

// "Mark all" variant:
const markAll = (status: AttendanceStatus) => {
  setRows(prev => prev.map(r => ({ ...r, status })));
  // Every row gets a new object with the same status
};
```

**Derived counts — not stored in state:**
```tsx
const presentCount = rows.filter(r => r.status === 'Present').length;
const absentCount  = rows.filter(r => r.status === 'Absent').length;
const lateCount    = rows.filter(r => r.status === 'Late').length;
```
These are recalculated every render. No need for state.

**`TYPE` as literal — the `Tab` type:**
```tsx
type Tab = 'mark' | 'summary';
const [tab, setTab] = useState<Tab>('mark');
```
TypeScript will reject `setTab('invalid')` — only `'mark'` or `'summary'` are valid.

---

### Write This

Trace `handleSave` in Attendance.tsx completely:
```tsx
const handleSave = async () => {
  if (!classId) return;
  setSaving(true);
  try {
    await API.post('/Attendance/bulk', {
      classId,
      date,
      records: rows.map(r => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes ?? null
      })),
    });
    setSaved(true);
  } catch {
    alert('Failed to save attendance.');
  } finally {
    setSaving(false);
  }
};
```

1. What does `rows.map(r => ({ studentId: ..., status: ..., notes: ... }))` produce?
2. Why does the button show `'✓ Saved'` after saving? (Trace the `saved` state)
3. Why does clicking any status button set `setSaved(false)` first?

---

### Interview Questions

- This page has 10 state variables. Is that too many? What would be the alternative?
- Why are `presentCount`, `absentCount`, `lateCount` derived and not stored in state?
- What does the guard `if (!classId || tab !== 'mark') return;` prevent?
- Why does changing a status call `setSaved(false)` before updating?
- What is the type `'mark' | 'summary'`? What does TypeScript do if you write `setTab('other')`?

---

# BRICK 15 — The Achievements Page: Card Grid and Role-Based Features

**What you're building:** Understanding a card-grid layout and role-specific API fetching.

**Concept learned:** Conditional data fetching by role, card grid layout, `&&` visibility.

---

### The Concept

Open [myschool-frontend/src/pages/Achievements.tsx](myschool-frontend/src/pages/Achievements.tsx).

**Role-based data fetching:**
```tsx
const canAdd = role === 'Principal' || role === 'Teacher';

const fetchAchievements = () => {
  const base = API.get<Achievement[]>('/Achievements');
  if (canAdd) {
    // Teachers/Principals also need the student list (for the "Add" modal dropdown)
    Promise.all([base, API.get<Student[]>('/Students')])
      .then(([a, s]) => { setAchievements(a.data); setStudents(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  } else {
    // Students/Parents only need the achievements list
    base
      .then(a => setAchievements(a.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }
};
```

Students and Parents don't need the student list (they can't add achievements), so we don't fetch unnecessary data.

**The "Add" button — only rendered for authorised roles:**
```tsx
{canAdd && (
  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
    + Add Achievement
  </button>
)}
```

If `canAdd` is false (Student or Parent), nothing is rendered here. They also won't see the Delete button in each card:
```tsx
{canAdd && (
  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>
    Delete
  </button>
)}
```

---

### Write This

Open the full Achievements.tsx page and find the card rendering section. Trace how each achievement card is built:
1. What data does each card show? (title, student name, trophy icon, etc.)
2. How is the trophy icon picked? (`TROPHY_ICONS` array)
3. What is `a.isPublic` used for?

---

### Interview Questions

- Why does the Achievements page fetch different data depending on the user's role?
- How does `canAdd` work? What type is it?
- What is the difference between not rendering a button and rendering a disabled button?
- Why is it important to also protect endpoints on the backend, not just hide buttons on the frontend?

---

# BRICK 16 — The CSS Design System

**What you're building:** A deep understanding of the visual system that makes the app look consistent.

**Concept learned:** CSS variables, utility classes, BEM-lite naming, responsive flexbox.

---

### The Concept

Open [myschool-frontend/src/index.css](myschool-frontend/src/index.css). This is the entire design system — no external CSS framework is used (no Bootstrap, no Tailwind). Every class is custom.

**The colour palette (CSS variables in `:root`):**
```css
:root {
  --primary: #4f46e5;          /* indigo — used for buttons, active nav */
  --primary-dark: #4338ca;     /* darker indigo — hover state */
  --sidebar-bg: #1e1b4b;       /* very dark navy — sidebar background */
  --sidebar-active: #312e81;   /* slightly lighter — active nav item bg */
  --success: #10b981;          /* green — present, high score */
  --danger: #ef4444;           /* red — absent, delete, low score */
  --warning: #f59e0b;          /* amber — late, medium score */
}
```

**Key patterns to understand:**

1. **`.app-layout`** — the root layout, `display: flex; height: 100vh` puts sidebar and main side by side
2. **`.sidebar`** — `flex-direction: column; flex-shrink: 0; width: 240px`
3. **`.main-area`** — `flex: 1; overflow-y: auto` — takes remaining space, scrolls independently
4. **`.stats-grid`** — `display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` — responsive stat cards
5. **`.badge`** — small inline labels (`badge-success` = green, `badge-danger` = red, etc.)
6. **`.btn`, `.btn-primary`, `.btn-ghost`** — button variants
7. **`.modal-overlay`** — `position: fixed; inset: 0; background: rgba(0,0,0,0.5)` — covers the entire screen
8. **`.modal`** — positioned in the centre, white box, `max-width: 480px`

**CSS specificity quick reference:**
- `div` — specificity: 0,0,1
- `.class` — specificity: 0,1,0
- `#id` — specificity: 1,0,0
- `!important` — overrides everything (avoid using it)

When two rules conflict, the one with higher specificity wins. If equal, the one defined later in the file wins.

---

### Write This

In DevTools, find the `.sidebar` element. Look at its computed styles and identify:
1. What `display` value does it have?
2. What `flex-direction` does it use?
3. What `width` is it?
4. What `background-color` value does `var(--sidebar-bg)` resolve to?

Then open [index.css](myschool-frontend/src/index.css) and find the `.nav-link.active` rule. What CSS properties make the active link look different from the others?

---

### Interview Questions

- What is a CSS variable? How do you define and consume one?
- What is CSS specificity? Which is more specific: `.card .title` or `.title`?
- What does `display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` do?
- How does `position: fixed; inset: 0` work? What does `inset` mean?
- What is `flex: 1` shorthand for? What does it do to the main content area?

---

# BRICK 17 — The auth.ts Utility: Pure Functions

**What you're building:** Understanding the helper functions used across every page.

**Concept learned:** Pure functions, localStorage, deriving data from stored state.

---

### The Concept

Open [myschool-frontend/src/utils/auth.ts](myschool-frontend/src/utils/auth.ts). These are all pure utility functions — they don't use React hooks and can be called anywhere.

```tsx
// Read the user object from localStorage
export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

// Convenience: get just the role
export const getRole = (): string | null => getUser()?.role ?? null;

// Check authentication: just see if a token exists
export const isAuthenticated = (): boolean =>
  !!localStorage.getItem('token');
// !! converts any truthy value to true, any falsy value to false
// localStorage returns null if the key doesn't exist
// null → false, a string → true

// Build initials from a name
export const getInitials = (name: string): string =>
  name
    .split(' ')           // "Ahmed Hassan" → ['Ahmed', 'Hassan']
    .map((n) => n[0])     // → ['A', 'H']
    .join('')             // → 'AH'
    .toUpperCase()        // → 'AH' (already upper, but defensive)
    .slice(0, 2);         // max 2 characters
```

**localStorage:** A browser key-value store that persists across page reloads (unlike regular JavaScript variables). Values must be strings, so objects are serialised with `JSON.stringify` and deserialised with `JSON.parse`.

```ts
// Store
localStorage.setItem('user', JSON.stringify({ name: 'Ahmed', role: 'Teacher' }));

// Read
const raw = localStorage.getItem('user');  // string or null
const user = JSON.parse(raw);              // object

// Delete
localStorage.removeItem('user');
```

---

### Write This

In your browser console:
```js
// 1. Store something
localStorage.setItem('test', JSON.stringify({ name: 'Ahmed', score: 85 }));

// 2. Read it back
const raw = localStorage.getItem('test');
console.log(raw);           // the string
console.log(typeof raw);    // 'string'

const obj = JSON.parse(raw);
console.log(obj);           // the object
console.log(obj.name);      // 'Ahmed'

// 3. Check !! conversion
console.log(!!null);        // false
console.log(!!'');          // false
console.log(!!'hello');     // true
console.log(!!0);           // false
console.log(!!1);           // true

// 4. Clean up
localStorage.removeItem('test');
```

---

### Interview Questions

- What is `localStorage`? How long does data persist in it?
- What is `JSON.stringify` and `JSON.parse`? Why do we need them for localStorage?
- What does `!!value` do? When is it useful?
- What does `?.` (optional chaining) do? What does it return when the chain breaks?
- What is a pure function? Why are the functions in `auth.ts` pure?

---

# BRICK 18 — Environment Variables and Vite Configuration

**What you're building:** Understanding how development and production configurations differ.

**Concept learned:** `.env` files, `import.meta.env`, Vite proxy, build output.

---

### The Concept

**Environment variables** let you change configuration without changing code. Different environments (dev, staging, production) have different API URLs, feature flags, etc.

In Vite, env variables must be prefixed with `VITE_` to be accessible in browser code:

```
# .env.development (for local dev)
VITE_API_URL=http://localhost:5000/api

# .env.production (for deployment)
VITE_API_URL=https://api.myschool.com/api
```

Access in code:
```ts
const baseURL = import.meta.env.VITE_API_URL ?? '/api';
```

`import.meta.env` is a Vite-specific object. At build time, Vite replaces it with the actual values. `process.env` (Node.js) does NOT work in browser code.

**Vite proxy for local development** — open `myschool-frontend/vite.config.ts`:
```ts
// (approximate structure)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```
When the dev server sees a request to `/api/Students`, it forwards it to `http://localhost:5000/api/Students`. This avoids CORS errors in development.

**Build output:**
```bash
npm run build
# Creates dist/ folder with:
# - index.html
# - assets/index-[hash].js   (all your React code, minified)
# - assets/index-[hash].css  (all your CSS, minified)
```

The `dist/` folder is what you deploy. The backend can serve these static files.

---

### Interview Questions

- What is an environment variable? Why use them instead of hardcoding values?
- Why must Vite env variables start with `VITE_`?
- What is `import.meta.env`? How is it different from `process.env`?
- What is a Vite proxy and why is it needed in local development?
- What does `npm run build` produce? Where does it go?

---

# BRICK 19 — TypeScript: The Types File Deep Dive

**What you're building:** Full mastery of every type used in this project.

**Concept learned:** How types mirror backend DTOs, why type safety matters end-to-end.

---

### The Concept

Open [myschool-frontend/src/types/index.ts](myschool-frontend/src/types/index.ts).

Every interface in this file is the TypeScript mirror of a C# DTO (Data Transfer Object) from the backend. When the backend sends:
```json
{ "id": 1, "name": "Ahmed", "classId": 2, "className": "Grade 5", "marksCount": 10, "averageScore": 87.5 }
```

TypeScript's `Student` interface ensures your code handles every field correctly:
```ts
interface Student {
  id: number;
  name: string;
  profileImage?: string;   // optional — may not be in the response
  classId: number;
  className: string;
  marksCount: number;
  averageScore: number | null;  // null when no marks recorded
}
```

**Key design decisions in the types:**

1. `AuthUser.role` is typed as `'Principal' | 'Teacher' | 'Student' | 'Parent'` — not just `string`. This means TypeScript catches typos like `role === 'Pricipal'` (note the typo).

2. `Student.averageScore: number | null` — `null` is intentional (server sends `null` when there are no marks). This forces you to handle the null case everywhere you use `averageScore`.

3. `Achievement.isPublic: boolean` — determines whether non-logged-in users can see it on the public landing page.

4. `PublicClassDetail.seats: boolean[]` — an array where `true` = occupied seat, `false` = available. The class room visualisation maps over this array to render the seat grid.

---

### Write This

For each interface in `types/index.ts`, find where it is used in the pages:
| Interface | Used in Page(s) |
|---|---|
| `AuthUser` | `auth.ts`, `Login.tsx` |
| `Student` | `Students.tsx`, `Marks.tsx`, `Achievements.tsx` |
| `Class` | `Students.tsx`, `Attendance.tsx` |
| `Mark` | `Marks.tsx`, `MyMarks.tsx` |
| `DashboardStats` | `Dashboard.tsx` |
| `ManagedUser` | `ManageUsers.tsx` |
| `AttendanceRow` | `Attendance.tsx` |
| `AttendanceSummaryRow` | `Attendance.tsx` |

For each interface: open the page that uses it and find where `API.get<ThatInterface>()` or `API.get<ThatInterface[]>()` is called.

---

### Interview Questions

- What does it mean for TypeScript types to "mirror" backend DTOs?
- Why is `role: 'Principal' | 'Teacher' | 'Student' | 'Parent'` better than `role: string`?
- What is the difference between a field being optional (`?`) and a field being `null`?
- How does TypeScript help you when you receive API data with the wrong shape?
- What happens if you access `student.averageScore.toFixed(1)` and `averageScore` is `null`?

---

# BRICK 20 — Putting It All Together: Read a Page from Top to Bottom

**What you're building:** The habit of reading and fully understanding any page in the project.

**Concept learned:** How every concept connects into a complete, working feature.

---

### The Exercise

Open [myschool-frontend/src/pages/ManageUsers.tsx](myschool-frontend/src/pages/ManageUsers.tsx) — a page you haven't studied yet. Read it completely and answer every question below from the code alone:

1. **State** — List every `useState` call. What type does each hold?
2. **Data fetching** — What API endpoints does this page call? When does each call happen?
3. **Rendering** — What are the three loading/empty/data states?
4. **Role-based UI** — What does a Principal see that a Teacher doesn't?
5. **Modals** — How many modals are there? What does each one do?
6. **TypeScript** — What interfaces from `types/index.ts` does this page use?
7. **Callbacks** — Trace one `onSaved` callback from the modal call back to the parent re-fetch.

---

### The Rebuild Exercise (Most Important)

Close every file. Open a blank TypeScript file. Try to re-build the **Students page** from memory:

1. Set up imports
2. Declare the correct state variables with correct types
3. Write the `fetchAll` function using `Promise.all`
4. Write the `useEffect` that calls `fetchAll` on mount
5. Write the `filtered` derived value with the search logic
6. Write the JSX: `<Layout>` → header → page-content → card → three-state render (loading / empty / table)
7. Add the `AddStudentModal` component with its props, state, validation, and API call

Do not look at the code until you've tried everything. When you get stuck, read only the section you're stuck on, then close it again and continue.

This is how you go from reading code to writing code.

---

# Quick Reference: Patterns Used in Every Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STATE PATTERN                                                             │
│                                                                           │
│  const [data, setData]       = useState<T[]>([]);                         │
│  const [loading, setLoading] = useState(true);                            │
│  const [error, setError]     = useState('');                              │
│  const [showModal, setShowModal] = useState(false);                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ FETCH PATTERN (inside useEffect)                                          │
│                                                                           │
│  API.get<T[]>('/Endpoint')                                                │
│    .then((res) => setData(res.data))                                      │
│    .catch(console.error)                                                  │
│    .finally(() => setLoading(false));                                     │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ THREE-STATE RENDER PATTERN                                                │
│                                                                           │
│  if (loading) return <Spinner />;                                         │
│                                                                           │
│  {data.length === 0 ? (                                                   │
│    <EmptyState />                                                         │
│  ) : (                                                                    │
│    <Table rows={data} />                                                  │
│  )}                                                                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ FORM SUBMIT PATTERN                                                       │
│                                                                           │
│  const handleSubmit = async (e: React.FormEvent) => {                     │
│    e.preventDefault();                                                    │
│    if (!validate()) return;                                               │
│    setLoading(true);                                                      │
│    try {                                                                  │
│      await API.post('/Endpoint', formData);                               │
│      onSaved();                                                           │
│    } catch (err) {                                                        │
│      setError(extractMessage(err));                                       │
│    } finally {                                                            │
│      setLoading(false);                                                   │
│    }                                                                      │
│  };                                                                       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ MODAL PATTERN                                                             │
│                                                                           │
│  Parent:                                                                  │
│    {showModal && <MyModal onClose={() => setShowModal(false)}             │
│                           onSaved={() => { setShowModal(false);           │
│                                           fetchAll(); }} />}              │
│                                                                           │
│  Modal:                                                                   │
│    <div className="modal-overlay" onClick={onClose}>                      │
│      <div className="modal" onClick={e => e.stopPropagation()}>           │
│        ...                                                                │
│        <button onClick={onClose}>Cancel</button>                          │
│        <button onClick={handleSave}>Save</button>                         │
│      </div>                                                               │
│    </div>                                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# Master Checklist

Use this to track your progress. Only mark something done when you can explain it out loud without looking at notes.

## JavaScript / TypeScript Foundations
- [ ] `const` vs `let` — when to use each
- [ ] Arrow functions — syntax with and without a body
- [ ] Destructuring — objects and arrays
- [ ] Spread operator — objects and arrays
- [ ] `.map()`, `.filter()`, `.find()` — what each returns
- [ ] `async`/`await` and `try/catch/finally`
- [ ] Optional chaining `?.` — what it returns when chain breaks
- [ ] Nullish coalescing `??` — how it differs from `||`
- [ ] Template literals — backtick syntax with `${}`
- [ ] TypeScript interfaces — defining and using them
- [ ] TypeScript generics — reading `API.get<Student[]>()`
- [ ] Union types — `'Principal' | 'Teacher'`
- [ ] Optional properties — `profileImage?: string`

## React Core
- [ ] What a component is — function that returns JSX
- [ ] `className` vs `class`
- [ ] Fragments — `<>...</>`
- [ ] Props — passing data and functions down
- [ ] `children` prop — Layout pattern
- [ ] `useState` — declaring, reading, updating
- [ ] Immutable state updates — spread to create new objects/arrays
- [ ] Derived state — computed on every render, not stored
- [ ] `useEffect` — when it runs, dependency array
- [ ] Early return pattern — loading, error, empty states

## React Router
- [ ] `BrowserRouter`, `Routes`, `Route` — the tree structure
- [ ] `<Link>` vs `<NavLink>` — when to use each
- [ ] `useNavigate` — programmatic navigation
- [ ] `useParams` — reading URL parameters
- [ ] `ProtectedRoute` — how it works

## Axios / API
- [ ] `axios.create()` — why we create an instance
- [ ] Request interceptor — attaches the JWT token
- [ ] Response interceptor — handles 401 globally
- [ ] `API.get<T>()`, `API.post()`, `API.delete()`
- [ ] Query params with `{ params: { ... } }`
- [ ] `Promise.all` — parallel fetching

## This Project's Patterns
- [ ] Three-state render: loading → empty → data
- [ ] Modal pattern: parent controls visibility via state
- [ ] Fetch pattern: useEffect + Promise.all + finally setLoading
- [ ] Form pattern: controlled inputs + handleChange + async submit
- [ ] Role-based render: `canEdit && <button />`
- [ ] `scoreClass()` — maps number to CSS class
- [ ] `getUser()`, `getRole()`, `isAuthenticated()` — reading auth state
- [ ] `localStorage` — storing and reading JSON

---

*Work through each brick in order. The rebuild exercise in Brick 20 is not optional — it is the most important step. Being able to read code is not the same as being able to write it.*
