Left Sidebar Expanded View (Initial Home State)┌─────────────────────────┬───────────────────────────────────────────────────┐
│ LLM Council       🔍 ☰ │                 Built by JXLEE                    │
│                         │               (Disappears on chat)                │
│  ➕  New chat           │                                                   │
│  💬  Chats              │                 💥 Hey there                     │
│      Models List        │                                                   │
│  ⚙️  Settings           │   ┌───────────────────────────────────────────┐   │
│                         │   │ How can I help you today?                 │   │
│ Starred                 │   │                                           │   │
│  📄 Building focus...  │   │ ➕       [Writer 🤖] [send input button]  │   │
│  📄 Learn for high...   │   └───────────────────────────────────────────┘   │
│                         │                                                   │
│ Recents                 │                                                   │
│  📄 Caveman speak       │                                                   │
├─────────────────────────┤                                                   │
│ 📥 Download app         │                                                   │
└─────────────────────────┴───────────────────────────────────────────────────┘


- [Writer 🤖] - on-click opens floating modal for mode selection from existing modes  
- ☰ - on-click opens side bar
- ⚙️  Settings  - on-click opens settings view in right side(left side bar collapse autmatically when mouse leaves after click)
- Models List - on click it will slide out the models list from right side(left side bar collapse autmatically when mouse leaves after click)
- Starred & Recents  - would be shown when there would conversation done be users and chats could be saved in local storage

Mode Selector Modal (Floating Modal UI)

  ┌──────────────────────────────────────────────────┐  
  │  Select a Council Preset                         │  
  │  Single click to select. Double click to edit... │  
  │                                                  │  
  │  ┌────────────────────────────────────────────┐  │  
  │  │ 🎓  Academic                               │  │  
  │  │     Highest context for long papers        │  │  
  │  └────────────────────────────────────────────┘  │  
  │  ┌────────────────────────────────────────────┐  │  
  │  │ 📈  Finance                                │  │  
  │  │     Deep analysis & reporting              │  │  
  │  └────────────────────────────────────────────┘  │  
  │  ┌────────────────────────────────────────────┐  │  
  │  │ </> Coding                                 │  │  
  │  │     Code generation & review               │  │  
  │  └────────────────────────────────────────────┘  │  
  │  ┌────────────────────────────────────────────┐  │  
  │  │ ✎  Writer                                  │ │ 
  │  │     Creative writing & roleplay            │  │  
  │  └────────────────────────────────────────────┘  │  
  │  ┌────────────────────────────────────────────┐  │  
  │  │ ⚖️  Legal                                  │  │ 
  │  │     Document analysis                      │  │  
  │  └────────────────────────────────────────────┘  │  
 │                                                  │     
 └──────────────────────────────────────────────────┘  

 - use existing screen view to render inside modal.
 - after setting a mode if user opens the models list view in right side bar . user would able to see models automatically selected in preset(this feature is already implemented - just also need to render in web version ui correctly without conflicts) 


Chat screen 

┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│ LLM Council       🔍 ☰ │ Chats                                              [Select chats]  [New chat]    │
│                         │                                                                                  │
│  ➕  New chat           │   ┌──────────────────────────────────────────────────────────────────────────┐   │
│  💬  Chats              │   │ 🔍 Search chats...                                                       │   │
│      Models List        │   └──────────────────────────────────────────────────────────────────────────┘   │
│  ⚙️  Settings           │                                                                                  │
│                         │   Building a writing habit t...   2 days ago  Creative Writing (Story, Scripts)  │
│ Starred                 │   ────────────────────────────────────────────────────────────────────────────   │
│  📄 Building focus...  │   Caveman speak communication     3 days ago                                     │
│  📄 Learn for high...   │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   Building focus and consistency at 22   4 days ago                              │
│ Recents                 │   ────────────────────────────────────────────────────────────────────────────   │
│  📄 Caveman speak       │   Caveman speech style   last week                                               │
│  📄 Learn for high...   │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   GF   last week                                                                 │
│                         │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   Jr. Python developer job requirements and interview preparation   2 weeks ago   │
├─────────────────────────┤   ────────────────────────────────────────────────────────────────────────────   │
│  📥 Download App        │   Learn for high paying job   2 weeks ago                                        │
└─────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘

- when user want to delete chat 

┌─────────────────────────┬──────────────────────────────────────────────────────────────────────────────────┐
│ LLM Council       🔍 ☰ │ Chats                                0 selected  [Select all]  [Delete] [Cancel] |
│                         │                                                                                  │
│  ➕  New chat           │   ┌──────────────────────────────────────────────────────────────────────────┐   │
│  💬  Chats              │   │ 🔍 Search chats...                                                       │   │
│       Models List       │   └──────────────────────────────────────────────────────────────────────────┘   │
│  ⚙️  Settings           │                                                                                  │
│                         │   [ ]  Building a writing ...     2 days ago  Creative Writing (Story, Scripts)  │
│ Starred                 │   ────────────────────────────────────────────────────────────────────────────   │
│  📄 Building focus...  │   [ ]  Caveman speak communication     3 days ago                                     │
│  📄 Learn for high...   │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   [ ]  Building focus and consistency at 22   4 days ago                              │
│ Recents                 │   ────────────────────────────────────────────────────────────────────────────   │
│  📄 Caveman speak       │   [ ]  Caveman speech style   last week                                               │
│  📄 Learn for high...   │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   [ ]  GF   last week                                                                 │
│                         │   ────────────────────────────────────────────────────────────────────────────   │
│                         │   [ ]  Jr. Python developer job requirements and interview preparation   2 weeks ago   │
├─────────────────────────┤   ────────────────────────────────────────────────────────────────────────────   │
│  📥 Download App        │  [ ]  Learn for high paying job   2 weeks ago                                        │
└─────────────────────────┴──────────────────────────────────────────────────────────────────────────────────┘

- 🔍 -  when click on searck button 

 the Search Overlay for LLM Council: To implement this exact search system into your React Native for Web chat platform, you should use an absolute modal layout. It should listen for a global keyboard shortcut (like Ctrl + K or Cmd + K) or trigger immediately when a user clicks a search icon in your left sidebar.

 ┌────────────────────────────────────────────────┐
 │ 🔍 Search chats                               X│
 ├─────────────────────────────────────────────────┤
 │ 💬 Jr. Python developer job        Past week   │
 │ 💬 Creative Writing                Past month  │
 │ 💬 Caveman speak communication     Past year   │
 └────────────────────────────────────────────────┘

 - on hover on the chat in left sidebar - three dot ellipse should appear and when mouse leave should disappear 

 ┌────────────────────────────────────────────────────────┐
│ 🔑 Caveman speak communication                       ┆ │  <-- Active(on-hover)//Selected(onclick) Row Item
├────────────────────────────────────────────────────────┤
│    Caveman speech style                                │  <-- Normal Row Item
│                                                        │
│    GF                                                  │
│                                                        │
│    Jr. Python developer job require...                 │  <-- Truncated Text Item
└────────────────────────────────────────────────────────┘
- Active Row Overlay: The top selected item features a background card container wrapper (backgroundColor: '#1e293b' or similar dark variant) with rounded corner boundaries to distinguish it from the rest of the static history stack.
- Context Options Trigger: The far-right boundary of the highlighted item houses a vertical ellipsis character menu icon (┆ or ⋮). Tapping this icon displays a small popover overlay for management actions if chat is in recents list like Rename, Favorite/Star, or Delete.
- Text Truncation Rule: Long text headers dynamically collapse into a trailing dot formation (...) using the standard property configuration numberOfLines={1} to prevent paragraph descriptions from breaking line boundaries on tight phone screens.  
- If in starred list - the popover overlay will has option like  unstar, rename, delete 
- starred list on ui will only shown when there is any chat starred by user, otherwise only recents list would be shown and if there are no conversation empty state would be shown

