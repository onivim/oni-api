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

export interface IWindowManager {
    split(direction: number, split: IWindowSplit): void
    showDock(direction: number, split: IWindowSplit): void
    moveLeft(): void
    moveRight(): void
    moveDown(): void
    moveUp(): void
    close(split: IWindowSplit): void
}

export interface IWindowSplit {
    render(): JSX.Element
}

export interface EditorManager {
    allEditors: Editor
    activeEditor: Editor
}

export interface InputManager {
    bind(keyChord: string | string[], actionFunction: any, filterFunction?: () => boolean): void
    hasBinding(keyChord: string): boolean
    unbind(keyChord: string | string[]): void
    unbindAll(): void
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
 * An EditorLayer is a UI overlay presented over a buffer.
 *
 * This allows for all manners of custom rendering - whether it is simply
 * overlaying tokens or showing adorners, or completely overriding the
 * rendering layer of the buffer.
 */
export interface EditorLayer {

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
    render(context: EditorLayerRenderContext): JSX.Element
}

/**
 * EditorLayerRenderContext
 */
export interface EditorLayerRenderContext {
    isActive: boolean

    windowId: number

    bufferToScreen: Coordinates.BufferToScreen
    screenToPixel: Coordinates.ScreenToPixel
    dimensions: Shapes.Rectangle
}

export interface Editor {
    mode: string
    onModeChanged: IEvent<Vim.Mode>

    activeBuffer: Buffer

    openFile(file: string, method?: string): Promise<Buffer>

    onBufferEnter: IEvent<EditorBufferEventArgs>
    onBufferLeave: IEvent<EditorBufferEventArgs>
    onBufferChanged: IEvent<EditorBufferChangedEventArgs>
    onBufferScrolled: IEvent<EditorBufferScrolledEventArgs>
    onBufferSaved: IEvent<EditorBufferEventArgs>

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

    addLayer(layer: EditorLayer): void
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
        input: InputManager
        language: any /* TODO */
        log: any /* TODO */
        menu: Menu.Api
        process: Process
        statusBar: StatusBar
        windows: IWindowManager
        workspace: Workspace
    }
}
