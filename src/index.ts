import * as ChildProcess from "child_process"
import { EventEmitter } from "events"

import * as types from "vscode-languageserver-types"

import { Event, IEvent } from "oni-types"

export type DisposeFunction = () => void

/**
 * API surface area for registering and executing commands
 */
export namespace Commands {
    export type CommandCallback = (args?: any) => any
    export type CommandEnabledCallback = () => boolean

    export interface ICommand {
        command: string
        name: string
        detail: string
        enabled?: CommandEnabledCallback
        messageSuccess?: string
        messageFail?: string
        execute: CommandCallback
    }

    export interface Api {
        registerCommand(command: ICommand): void
        unregisterCommand(commandName: string): void
        executeCommand(name: string, args?: any): boolean | void
    }
}

export interface IToken {
    tokenName: string
    range: types.Range
}

export type ConfigurationValues = { [key: string]: any}

export interface Configuration {
    onConfigurationChanged: IEvent<ConfigurationValues>
    getValue<T>(configValue: string, defaultValue?: T): T
    setValues(configurationValues: ConfigurationValues): void
}

export interface Workspace {
    onDirectoryChanged: IEvent<string>
}

export namespace Snippets {
    /**
     * Metadata describing a snippet
     */
    export interface Snippet {
        prefix: string
        body: string
        description: string
    }

    /**
     * `SnippetProvider` is a strategy for providing snippets for a particular language
     *
     * This can range from loading from a file/network to ad-hoc configuration in user config.
     */
    export interface SnippetProvider {
        getSnippets(language: string): Promise<Snippet[]>
    }

    /**
     * `SnippetManager` is the main entry point for integrating with snippets.
     */
    export interface SnippetManager {
        isSnippetActive: boolean

        insertSnippet(snippet: string): Promise<void>

        cancel(): Promise<void>
        nextPlaceholder(): Promise<void>
        previousPlaceholder(): Promise<void>

        getSnippetsForLanguage(language: string): Promise<Snippet[]>
        registerSnippetProvider(snippetProvider: SnippetProvider): void
    }
}

export type Direction = "left" | "right" | "down" | "up"
export type SplitDirection = "horizontal" | "vertical"

export interface WindowSplitHandle {
    id: string

    // Close the split, removing it from the editor surface.
    close(): void

    // Show makes a split visible
    show(): void

    // Hide makes a split invisible
    hide(): void

    // Set focus on a split
    focus(): void


    // Set the size of the split. Dependent on the split orientation.
    setSize(size: number): void
}

export interface IWindowManager {
    // onUnhandledMove is dispatched when a move isn't handled. This can occur
    // at the boundaries, when there is no further split
    onUnhandledMove: IEvent<Direction>

    // Create a split on the editor surface
    // If direction is 'left', 'right', 'down', or 'up', the split
    // will be created in a dock. Otherwise, it will be in the primary
    // editor surface.
    createSplit(direction: Direction | SplitDirection, split: IWindowSplit): WindowSplitHandle

    // Moves from the currently focused split to another focused split
    move(direction: Direction): void
}

export interface IWindowSplit {
    render(): JSX.Element
}

export enum FileOpenMode {
    // Open file in existing editor / tab, if it is already open.
    // Otherwise, open in a new tab in the active editor.
    Edit = 0,

    // Open file in a new vertical split
    VerticalSplit,

    // Open file in a new horizontal split
    HorizontalSplit,

    // Open file in a new tab, in the active editor
    NewTab,

    // Open file in existing tab. Replaces the currently
    // active file in the tab.
    ExistingTab,
}

export interface FileOpenOptions {
    openMode: FileOpenMode
}

export const DefaultFileOpenOptions: FileOpenOptions = {
    openMode: FileOpenMode.Edit
}

export interface EditorManager {

    /**
     * An array of all available `Editor` instances
     */
    allEditors: Editor[]

    /**
     * A proxy that _always_ points to the active `Editor`. This means
     * you can avoid always needing to hook/unhook events when the
     * active `Editor` changes by hooking events on `anyEditor`
     */
    anyEditor: Editor

    /**
     * The currently active `Editor` instance
     */
    activeEditor: Editor

    /**
     * Event that is dispatched when the active `Editor` changes,
     * for example, when focus moves from one `Editor` to another.
     */
    onActiveEditorChanged: IEvent<Editor>

    openFile(filePath: string, options?: FileOpenOptions): Promise<Buffer>
}

/** 
 * Input API entry point
 */
export namespace Input {

    export type InputAction = () => void

    /**
     * Often, you want a keybinding to be available in certain modes, but not other modes.
     * Vim handles this by exposing several variations of its `map` command (like `nmap`, `imap`, `noremap`, etc)
     *
     * In Oni, the filter function determines whether or not a binding ins enabled. It's simply a function
     * that returns `true` or `false`.
     */
    export type InputFilter = () => boolean

    export interface InputManager {

        /**
         * Bind a key or set of keys to an _action_
         *
         * The _action_ can either be a JavaScript callback, or a _command_ string.
         * 
         * To see available command strings, check out our [KeyBindings file](https://github.com/onivim/oni/blob/master/browser/src/Input/KeyBindings.ts)
         *
         * `filterFunction` is an optional third argument. If it returns `true`, the input
         * binding is enabled. This is helpful, for example, to enable key bindings only
         * in certain conditions.
         *
         * An example usage of the filter function might be:
         * ```
         * const isNormalMode = () => oni.editors.activeEditor.mode === "normal"
         * const isVisualMode = () => oni.editors.activeEditor.mode === "visual"
         * oni.input.bind("<esc>", () => alert("Escape pressed in normal mode!"), isNormalMode);
         * oni.input.bind("<esc>", () => alert("Escape pressed in visual mode!"), isVisualMode);
         * ```
         *
         * In this case, the `isNormalMode` and `isVisualMode` functions are used as _filters_. When the `<esc>` key is pressed,
         * all bindings for `<esc>` are evaluated, and the first one with a passing filter (or no filter) is used.
         */
        bind(keyChord: string | string[], actionOrCommand: InputAction | string, filterFunction?: InputFilter): void

        hasBinding(keyChord: string): boolean

        /**
         * `unbind` removes an keybindings present on a key.
         *
         * `unbind` is useful for removing default functionality. When your configuration is loaded, the default
         * keybindings provided by Oni are applied, but you can always opt-out of these in order to restore
         * default functionality.
         *
         * For example, if I would prefer to use the [CtrlP](https://github.com/ctrlpvim/ctrlp.vim) plugin, you could [install that plugin](https://github.com/onivim/oni/wiki/Plugins#installing-a-vim-plugin),
         * and then use `oni.input.unbind("<c-p>")` to prevent Oni from opening the bundled file opener. When there are no keybindings present, the input sequence is passed to the active editor (usually Neovim) to handle.
         */
        unbind(keyChord: string | string[]): void

        unbindAll(): void
    }
}

export interface IPluginManager {
    getPlugin(name: string): any
    loaded: boolean
}

/**
 * Automation API definition
 *
 * The Automation API provides a set of utilities
 * geared towards testing Oni's functionality.
 */
export namespace Automation {
    export type WaitConditionChecker = () => boolean

    export interface Api {

        // Send input directly to the active editor
        sendKeys(key: string): void

        // Utility method to delay test execution for a specified period of time.
        // Should be used sparingly, and often can be replaced with a determinitisc
        // `waitFor` condition.
        sleep(time: number): Promise<void>

        // Wait for a specific condition to be true within a time limit.
        // If not true by the expiration time, the test will register a failure
        waitFor(condition: WaitConditionChecker, timeout?: number): Promise<void>

        // Wait for an editor to be initialized
        waitForEditors(): Promise<void>
    }
}

export interface NeovimEditorCapability {

    // Call a VimL function and return the result
    callFunction(functionName: string, args: any[]): Promise<any>

    // Send a direct set of key inputs to Neovim
    input(keys: string): Promise<void>

    // Evaluate an expression, and return the result
    eval(expression: string): Promise<any>

    // Execute a command
    command(command: string): Promise<void>
}

/**
 * A BufferLayer is a UI overlay presented over a buffer.
 *
 * This allows for all manners of custom rendering - whether it is simply
 * overlaying tokens or showing adorners, or completely overriding the
 * rendering layer of the buffer.
 */
export interface BufferLayer {

    /**
     * Unique id for the buffer layer. This must be globally unique and is used to reference the layer.
     */
    id: string

    /**
     * `friendlyName` is used when showing the layer int eh UI
     */
    friendlyName?: string

    /**
     * `render` returns a custom UI element. Note that this may be called multiple times per buffer,
     * if there are multiple windows with the same buffer.
     */
    render(context: BufferLayerRenderContext): JSX.Element
}

/**
 * BufferLayerRenderContext
 */
export interface BufferLayerRenderContext {
    isActive: boolean

    windowId: number

    /**
     * Function that takes a _buffer_ position (line, character) and converts it to a
     * _screen cell_ position.
     */
    bufferToScreen: Coordinates.BufferToScreen

    /**
     * Function that takes a _screen cell_ position and converts it to a _pixel_ position.
     */
    screenToPixel: Coordinates.ScreenToPixel

    /**
     * Dimensions of the buffer window, in cells.
     */
    dimensions: Shapes.Rectangle
}

export type InputCallbackFunction = (input: string) => Promise<void>

export interface Editor {
    mode: string

    activeBuffer: Buffer

    /**
     * Helper function to queue / block input while a long-running process
     * is occurring.
     *
     * This is important for API calls that may require multiple steps while
     * the user is typing, for example, auto-closing pairs or snippets.
     *
     * This takes a function that returns a promise, as well as an input
     * argument so that input can be entered exclusively by the block.
     *
     * Use sparingly as this may cause a visible delay in typing.
     */
    blockInput(atomicInputFunction: (inputCallback: InputCallbackFunction) => Promise<void>): void

    openFile(file: string, openOptions?: FileOpenOptions): Promise<Buffer>

    getBuffers(): Array<Buffer | InactiveBuffer>

    onBufferEnter: IEvent<EditorBufferEventArgs>
    onBufferLeave: IEvent<EditorBufferEventArgs>
    onBufferChanged: IEvent<EditorBufferChangedEventArgs>
    onBufferScrolled: IEvent<EditorBufferScrolledEventArgs>
    onBufferSaved: IEvent<EditorBufferEventArgs>
    onCursorMoved: IEvent<Cursor>
    onModeChanged: IEvent<Vim.Mode>

    // Optional capabilities for the editor to implement
    neovim?: NeovimEditorCapability
}

export interface EditorBufferChangedEventArgs {
    buffer: Buffer
    contentChanges: types.TextDocumentContentChangeEvent[]
}

export interface EditorBufferScrolledEventArgs {
    bufferTotalLines: number
    windowTopLine: number
    windowBottomLine: number
}

export interface Buffer {
    id: string
    language: string
    filePath: string
    cursor: Cursor
    version: number
    modified: boolean

    lineCount: number

    addLayer(layer: BufferLayer): void
    removeLayer(layer: BufferLayer): void

    applyTextEdits(edit: types.TextEdit | types.TextEdit[]): Promise<void>
    getLines(start?: number, end?: number): Promise<string[]>
    getTokenAt(line: number, column: number): Promise<IToken>
    getSelectionRange(): Promise<types.Range>

    setLines(start: number, end: number, lines: string[]): Promise<void>
    setCursorPosition(line: number, column: number): Promise<void>
}

export interface InactiveBuffer {
    id: string
    language: string
    filePath: string
    version: number
    modified: boolean
    lineCount: number
}

// Zero-based position of the cursor
// Note that in Vim, this is a 1-based position
export interface Cursor {
    line: number
    column: number
}

// TODO: Remove this, replace with buffer
export interface EditorBufferEventArgs {
    language: string
    filePath: string
}

export interface Log {
    verbose(msg: string): void
    info(msg: string): void

    disableVerboseLogging(): void
    enableVerboseLogging(): void
}

/**
 * The `recorder` API enables the taking of screenshot or recording a video.
 *
 * The output defaults to the `os.tmpdir()` directory, but can be overridden
 * by the `recorder.outputPath` option.
 */
export interface Recorder {

   /**
    * Returns `true` if a recording is in progress, `false` otherwise
    */
   isRecording: boolean 

   /**
    * Start recording a video.
    *
    * Videos are recorded in `.webm` format.
    */
    startRecording(): void

    /**
     * Stop recording a video. 
     *
     * Optionally specify the destination `fileName`.
     */
    stopRecording(fileName?: string): Promise<void>

    /**
     * Take a screenshot.
     *
     * Optionally specify the destination `fileName.
     */
    takeScreenshot(fileName?: string): void
}

export interface StatusBar {
    getItem(globalId?: string): StatusBarItem
    createItem(alignment: number, globalId?: string): StatusBarItem
}

export interface Process {
    execNodeScript(scriptPath: string, args?: string[], options?: ChildProcess.ExecOptions, callback?: (err: any, stdout: string, stderr: string) => void): Promise<ChildProcess.ChildProcess>
    spawnNodeScript(scriptPath: string, args?: string[], options?: ChildProcess.SpawnOptions): Promise<ChildProcess.ChildProcess>
    spawnProcess(startCommand: string, args?: string[], options?: ChildProcess.SpawnOptions): Promise<ChildProcess.ChildProcess>
}

export interface StatusBarItem {
    show(): void
    hide(): void
    setContents(element: JSX.Element): void
    dispose(): void
}

export namespace Vim {
    export type Mode = "normal" | "visual" | "insert"
}

// In Oni, there are 3 main coordinate systems we reference when looking at building a
// rich UI feature.
//
// - *Buffer Space* - this is a zero-based line and column referencing a position in a buffer.
// - *Screen Space* - this is the zero-based x,y position of a cell in the screen grid.
// - *Pixel Space* - this is the actual pixel coordinate of an item.
//
// For rich UI features, like showing an error squiggle, being able to map from 'buffer space' to 'pixel space'
// is important so that we can show UI in the appropriate place. This mapping is really dependent on the
// dimensions of the window, because the same buffer shown in different size windows will have a different
// mapping from buffer space -> screen space.
//
// The mapping from screen space to pixel space is very simple, as this is purely dependent on the cell size
// (which is based on the font width / height)
export namespace Coordinates {
    export interface PixelSpacePoint {
        pixelX: number
        pixelY: number
    }

    export interface ScreenSpacePoint {
        screenX: number
        screenY: number
    }

    // Transforms a buffer position (line, column) to a screen space point
    export type BufferToScreen = (position: types.Position) => ScreenSpacePoint | null

    // Transforms a screen space point into pixel points
    export type ScreenToPixel = (screenPoint: ScreenSpacePoint) => PixelSpacePoint | null
}

export namespace Shapes {

    export interface Rectangle {
        x: number
        y: number
        width: number
        height: number
    }

    export namespace Rectangle {
        export function create(x: number, y: number, width: number, height: number): Rectangle {
            return {
                x,
                y,
                width,
                height,
            }
        }
    }
}

export namespace ToolTip {
    export enum OpenDirection {
        Up = 1,
        Down= 2,
    }
    export interface ToolTipOptions {
        position?: Coordinates.PixelSpacePoint
        openDirection: OpenDirection
        padding?: string
        onDismiss?: () => void
    }
}

export namespace Menu {
    export type filterFunc = (items: Menu.MenuOption[], searchString: string) => IMenuOptionWithHighlights[]
    export interface MenuInstance {
        onHide: IEvent<void>
        onItemSelected: IEvent<any>
        onSelectedItemChanged: IEvent<Menu.MenuOption>
        onFilterTextChanged: IEvent<string>
        selectedItem: MenuOption
        setLoading(isLoading: boolean): void
        setItems(items: MenuOption[]): void
        isOpen(): boolean
        show(): void
        hide(): void
        setFilterFunction(filterFn: filterFunc): void
    }

    export interface Api {
        create: () => MenuInstance
        closeActiveMenu: () => void
        isMenuOpen: () => boolean
        nextMenuItem: () => void
        previousMenuItem: () => void
        selectMenuItem: (index?: number) => Menu.MenuOption
    }

    export interface MenuOption {
        /**
         * Optional font-awesome icon
         */
        icon?: string

        label: string
        detail?: string
        /* Information relevant to the menu item not necessarily intended
         * for display */
        metadata?: {
            [id: string]: string
        }

        /**
         * A pinned option is always shown first in the menu,
         * before unpinned items
         */
        pinned?: boolean
    }

    export interface IMenuOptionWithHighlights extends Menu.MenuOption {
        labelHighlights: number[]
        detailHighlights: number[]
    }
}

export interface IColors {
    getColor(colorName: string): string | null
}

export namespace Plugin {
    export namespace Diagnostics {
        export interface Api {
            setErrors(key: string, fileName: string, errors: types.Diagnostic[]): void
        }
    }

    export interface Api extends EventEmitter {
        automation: Automation.Api
        colors: IColors
        commands: Commands.Api
        configuration: Configuration
        contextMenu: any /* TODO */
        diagnostics: Diagnostics.Api
        editors: EditorManager
        input: Input.InputManager
        language: any /* TODO */
        log: any /* TODO */
        plugins: IPluginManager
        menu: Menu.Api
        process: Process
        recorder: Recorder
        snippets: Snippets.SnippetManager
        statusBar: StatusBar
        windows: IWindowManager
        workspace: Workspace
    }
}
