// Import React dependencies.
import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
// Import the Slate editor factory.
import {
  BaseEditor,
  createEditor,
  Descendant,
  Editor,
  Text,
  Transforms,
} from 'slate'
// Import the Slate components and React plugin.
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'

// Define State
type CustomElement = { type: 'paragraph'; children: CustomText[] }
type CustomText = { text: string; bold?: boolean }

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: CustomElement
    Text: CustomText
  }
}

// Define our app...

// Define a React component to render leaves with bold text.
const Leaf = (props) => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >
      {props.children}
    </span>
  )
}
const DefaultElement = (props) => {
  return <p {...props.attributes}>{props.children}</p>
}
// Define a React component renderer for our code blocks.
const CodeElement = (props) => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const renderElement = (props) => {
  switch (props.element.type) {
    case 'code':
      return <CodeElement {...props} />
    default:
      return <DefaultElement {...props} />
  }
}

// Define a leaf rendering function that is memoized with `useCallback`.
const renderLeaf = (props) => {
  return <Leaf {...props} />
}

// Define our own custom set of helpers.
const CustomEditor = {
  isBoldMarkActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: (n) => n.bold === true,
      universal: true,
    })

    return !!match
  },

  isCodeBlockActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: (n) => n.type === 'code',
    })

    return !!match
  },

  toggleBoldMark(editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor)
    Transforms.setNodes(
      editor,
      { bold: isActive ? null : true },
      { match: (n) => Text.isText(n), split: true },
    )
  },

  toggleCodeBlock(editor) {
    const isActive = CustomEditor.isCodeBlockActive(editor)
    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'code' },
      { match: (n) => Editor.isBlock(editor, n) },
    )
  },
}

const App = () => {
  const editor = useMemo(() => withReact(createEditor()), [])

  // Add the initial value when setting up our state.
  const [value, setValue] = useState<Descendant[]>(
    JSON.parse(localStorage.getItem('content')) || [
      {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }],
      },
    ],
  )
  console.log(`🚀 > App > value`, value)

  // Render the Slate context.
  return (
    // Add the editable component inside the context.
    <Slate
      editor={editor}
      value={value}
      onChange={(value) => {
        setValue(value)

        const isAstChange = editor.operations.some(
          (op) => 'set_selection' !== op.type,
        )
        if (isAstChange) {
          // Save the value to Local Storage.
          const content = JSON.stringify(value)
          localStorage.setItem('content', content)
        }
      }}
    >
      <div>
        <button
          onMouseDown={(event) => {
            event.preventDefault()
            CustomEditor.toggleBoldMark(editor)
          }}
        >
          Bold
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault()
            CustomEditor.toggleCodeBlock(editor)
          }}
        >
          Code Block
        </button>
      </div>
      <Editable
        // Pass in the `renderElement` function.
        renderElement={renderElement}
        // For every format you add, Slate will break up the text content into "leaves",
        // and you need to tell Slate how to read it, just like for elements.
        // So let's define a Leaf component:
        renderLeaf={renderLeaf}
        // Define a new handler which prints the key that was pressed.
        // onKeyDown={(event) => {
        //   if (event.key === '&') {
        //     // Prevent the ampersand character from being inserted.
        //     event.preventDefault()
        //     // Execute the `insertText` method when the event occurs.
        //     editor.insertText('and')
        //   }
        // }}

        onKeyDown={(event) => {
          if (!event.ctrlKey) {
            return
          }

          // switch (event.key) {
          //   // When "`" is pressed, keep our existing code block logic.
          //   case '`': {
          //     event.preventDefault()
          //     const [match] = Editor.nodes(editor, {
          //       match: (n) => n.type === 'code',
          //     })
          //     Transforms.setNodes(
          //       editor,
          //       { type: match ? 'paragraph' : 'code' },
          //       { match: (n) => Editor.isBlock(editor, n) },
          //     )
          //     break
          //   }

          //   // When "B" is pressed, bold the text in the selection.
          //   case 'b': {
          //     event.preventDefault()
          //     Transforms.setNodes(
          //       editor,
          //       { bold: true },
          //       // Apply it to text nodes, and split the text node up if the
          //       // selection is overlapping only part of it.
          //       { match: (n) => Text.isText(n), split: true },
          //     )
          //     break
          //   }
          // }

          // Replace the `onKeyDown` logic with our new commands.
          switch (event.key) {
            case '`': {
              event.preventDefault()
              CustomEditor.toggleCodeBlock(editor)
              break
            }

            case 'b': {
              event.preventDefault()
              CustomEditor.toggleBoldMark(editor)
              break
            }
          }
        }}

        // onKeyDown={(event) => {
        //   if (event.key === '`' && event.ctrlKey) {
        //     event.preventDefault()
        //     // Determine whether any of the currently selected blocks are code blocks.
        //     const [match] = Editor.nodes(editor, {
        //       match: (n) => n.type === 'code',
        //     })
        //     // Toggle the block type depending on whether there's already a match.
        //     Transforms.setNodes(
        //       editor,
        //       { type: match ? 'paragraph' : 'code' },
        //       { match: (n) => Editor.isBlock(editor, n) },
        //     )
        //   }
        // }}
      />
    </Slate>
  )
}
ReactDOM.render(<App />, document.getElementById('root'))
