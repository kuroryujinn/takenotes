# UI Design Plan — TakeNotes Web3 Application

### Theme: Neobrutalism

---

# 1. Design Objective

The TakeNotes UI will use a **Neobrutalism design style** to create a bold, high-contrast, and highly readable interface for a Web3 note-taking application.

Goals:

* Clear wallet-driven workflow
* Highly visible actions (create / edit / delete notes)
* Minimal distractions
* Strong visual hierarchy
* Distinct Web3 identity

Neobrutalism emphasizes:

* Thick borders
* Solid colors
* Strong shadows
* Large typography
* Flat UI components

---

# 2. Design Principles

### 2.1 Bold Visual Hierarchy

Important elements should dominate the screen.

Examples:

* Wallet connection
* Create note button
* Note titles

Use:

* Large headings
* Strong contrast
* Thick borders

---

### 2.2 Minimal UI Complexity

Avoid:

* Glassmorphism
* Gradients
* Soft shadows
* Tiny UI controls

Use:

* Flat color blocks
* Clear card layout
* Direct interaction

---

### 2.3 Interaction Feedback

Every action must give visual feedback.

Examples:

| Action              | Feedback         |
| ------------------- | ---------------- |
| Connect wallet      | Highlight button |
| Save note           | Animated card    |
| Transaction pending | Status banner    |
| Delete note         | Warning color    |

---

# 3. Color System

Neobrutalism uses **loud colors with high contrast**.

### Primary Colors

| Purpose    | Color     |
| ---------- | --------- |
| Primary UI | Teal      |
| Accent     | Yellow    |
| Error      | Red       |
| Background | Off-white |
| Borders    | Black     |

Example palette:

```
Background: #F5F5F0
Primary: #2F6F7E
Accent: #FFD60A
Error: #E63946
Border: #000000
```

---

# 4. Typography

Use bold and readable fonts.

Recommended fonts:

* **Space Grotesk**
* **Inter**
* **IBM Plex Sans**

Font hierarchy:

| Element        | Size |
| -------------- | ---- |
| App title      | 48px |
| Section titles | 28px |
| Note titles    | 20px |
| Body text      | 16px |

Text should be **bold and sharp**.

---

# 5. Core UI Components

## 5.1 Hero Header

Purpose:

* App identity
* Explain Web3 functionality

Content:

```
TakeNotes
Securely store personal notes with wallet-authenticated blockchain transactions
```

Design:

* Large card
* Thick black border
* Teal background

---

## 5.2 Wallet Panel

Purpose:

Show wallet connection status.

Components:

* Connect wallet button
* Wallet address display
* Transaction status

Example layout:

```
[ Connect Freighter Wallet ]
Wallet: GABCD...1234
Status: Connected
```

Design:

* Bold yellow button
* Thick border
* Hover highlight

---

## 5.3 Note Creation Panel

Purpose:

Allow users to create notes.

Elements:

* Title input
* Note content textarea
* Save button

Example layout:

```
Title
[________________]

Content
[________________________]

[ Save Note ]
```

Design:

* White background
* Black border
* Strong yellow save button

---

## 5.4 Notes List

Purpose:

Display stored notes.

Each note card contains:

* Title
* Content
* Timestamp
* Delete button

Card layout:

```
+----------------------------------+
| Note Title                       |
|----------------------------------|
| Note content preview             |
|                                  |
| [Delete]            3 min ago    |
+----------------------------------+
```

Design:

* Thick black border
* Large padding
* Hover shadow

---

# 6. Neobrutalist Component Styles

### Borders

```
border: 4px solid black;
```

---

### Shadows

```
box-shadow: 6px 6px 0px black;
```

---

### Buttons

```
background: yellow;
border: 4px solid black;
font-weight: bold;
```

Hover state:

```
transform: translate(-2px, -2px);
box-shadow: 8px 8px 0px black;
```

---

# 7. Page Layout

Main layout structure:

```
+-------------------------------------+
| Header (App Title)                  |
+-------------------------------------+

+-------------------------------------+
| Wallet Panel                        |
+-------------------------------------+

+-------------------------------------+
| Create Note                         |
+-------------------------------------+

+-------------------------------------+
| Notes List                          |
|  +-------------------------------+  |
|  | Note Card                     |  |
|  +-------------------------------+  |
+-------------------------------------+
```

Use a **centered container layout**.

Max width:

```
900px
```

---

# 8. Responsive Design

The UI must work on:

* Desktop
* Tablet
* Mobile

Adjustments:

| Device  | Layout        |
| ------- | ------------- |
| Desktop | Grid layout   |
| Tablet  | Stacked cards |
| Mobile  | Single column |

Note cards should stack vertically on mobile.

---

# 9. Transaction Feedback UI

Because this is a Web3 app, transaction states must be visible.

States:

| Status    | UI            |
| --------- | ------------- |
| Pending   | Yellow banner |
| Confirmed | Green banner  |
| Failed    | Red banner    |

Example message:

```
Transaction request opened in Freighter.
Approve to continue.
```

---

# 10. Accessibility

Ensure:

* High contrast colors
* Large clickable areas
* Keyboard navigation
* Clear labels

Avoid small buttons.

---

# 11. Future UI Improvements

Possible additions:

* Note tags
* Search functionality
* Folder organization
* Dark mode
* Animated transaction status

---

# 12. Conclusion

The Neobrutalist UI for the TakeNotes Web3 application focuses on **clarity, bold design, and strong interaction feedback**. The design supports the blockchain workflow while maintaining a simple and highly visible note-taking interface.

This approach ensures that users can easily manage their notes while interacting with wallet-authenticated blockchain transactions.
