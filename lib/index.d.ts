/// <reference types="react" />
/// <reference types="node" />
import * as ChildProcess from "child_process";
import { EventEmitter } from "events";
import * as types from "vscode-languageserver-types";
import { IEvent } from "oni-types";
export declare type DisposeFunction = () => void;
export interface IToken {
    tokenName: string;
    range: types.Range;
}
export declare type ConfigurationValues = {
    [key: string]: any;
};
export interface Configuration {
    onConfigurationChanged: IEvent<ConfigurationValues>;
    getValue<T>(configValue: string, defaultValue?: T): T;
    setValues(configurationValues: ConfigurationValues): void;
}
export interface Workspace {
    onDirectoryChanged: IEvent<string>;
}
export interface IWindowManager {
    split(direction: number, split: IWindowSplit): void;
    showDock(direction: number, split: IWindowSplit): void;
    moveLeft(): void;
    moveRight(): void;
    moveDown(): void;
    moveUp(): void;
    close(split: IWindowSplit): void;
}
export interface IWindowSplit {
    render(): JSX.Element;
}
export interface EditorManager {
    allEditors: Editor;
    activeEditor: Editor;
}
export interface InputManager {
    bind(keyChord: string | string[], actionFunction: any, filterFunction?: () => boolean): void;
    unbind(keyChord: string | string[]): void;
    unbindAll(): void;
}
export interface NeovimEditorCapability {
    callFunction(functionName: string, args: any[]): Promise<any>;
    input(keys: string): Promise<void>;
    eval(expression: string): Promise<any>;
    command(command: string): Promise<void>;
}
export interface Editor {
    mode: string;
    onModeChanged: IEvent<Vim.Mode>;
    activeBuffer: Buffer;
    openFile(file: string): Promise<Buffer>;
    onBufferEnter: IEvent<EditorBufferEventArgs>;
    onBufferLeave: IEvent<EditorBufferEventArgs>;
    onBufferChanged: IEvent<EditorBufferChangedEventArgs>;
    onBufferScrolled: IEvent<EditorBufferScrolledEventArgs>;
    onBufferSaved: IEvent<EditorBufferEventArgs>;
    neovim?: NeovimEditorCapability;
}
export interface EditorBufferChangedEventArgs {
    buffer: Buffer;
    contentChanges: types.TextDocumentContentChangeEvent[];
}
export interface EditorBufferScrolledEventArgs {
    bufferTotalLines: number;
    windowTopLine: number;
    windowBottomLine: number;
}
export interface Buffer {
    id: string;
    language: string;
    filePath: string;
    cursor: Cursor;
    version: number;
    modified: boolean;
    lineCount: number;
    applyTextEdits(edit: types.TextEdit | types.TextEdit[]): Promise<void>;
    getLines(start?: number, end?: number): Promise<string[]>;
    getTokenAt(line: number, column: number): Promise<IToken>;
    getSelectionRange(): Promise<types.Range>;
    setLines(start: number, end: number, lines: string[]): Promise<void>;
    setCursorPosition(line: number, column: number): Promise<void>;
}
export interface Cursor {
    line: number;
    column: number;
}
export interface EditorBufferEventArgs {
    language: string;
    filePath: string;
}
export declare type ICommandCallback = (args?: any) => any;
export declare type ICommandEnabledCallback = () => boolean;
export interface ICommand {
    command: string;
    name: string;
    detail: string;
    enabled?: ICommandEnabledCallback;
    messageSuccess?: string;
    messageFail?: string;
    execute: ICommandCallback;
}
export interface Commands {
    registerCommand(command: ICommand): void;
}
export interface Log {
    verbose(msg: string): void;
    info(msg: string): void;
    disableVerboseLogging(): void;
    enableVerboseLogging(): void;
}
export interface StatusBar {
    getItem(globalId?: string): StatusBarItem;
    createItem(alignment: number, globalId?: string): StatusBarItem;
}
export interface Process {
    execNodeScript(scriptPath: string, args?: string[], options?: ChildProcess.ExecOptions, callback?: (err: any, stdout: string, stderr: string) => void): Promise<ChildProcess.ChildProcess>;
    spawnNodeScript(scriptPath: string, args?: string[], options?: ChildProcess.SpawnOptions): Promise<ChildProcess.ChildProcess>;
    spawnProcess(startCommand: string, args?: string[], options?: ChildProcess.SpawnOptions): Promise<ChildProcess.ChildProcess>;
}
export interface StatusBarItem {
    show(): void;
    hide(): void;
    setContents(element: JSX.Element): void;
    dispose(): void;
}
export declare namespace Vim {
    type Mode = "normal" | "visual" | "insert";
}
export declare namespace Automation {
    interface Api {
        sendKeys(input: string): void;
        waitFor(condition: () => boolean, timeout: number): Promise<void>;
        runTest(testPath: string): Promise<void>;
    }
}
export declare namespace Coordinates {
    interface PixelSpacePoint {
        pixelX: number;
        pixelY: number;
    }
}
export declare namespace ToolTip {
    enum OpenDirection {
        Up = 1,
        Down = 2,
    }
    interface ToolTipOptions {
        position?: Coordinates.PixelSpacePoint;
        openDirection: OpenDirection;
        padding?: string;
        onDismiss?: () => void;
    }
}
export declare namespace Menu {
    interface MenuOption {
        /**
         * Optional font-awesome icon
         */
        icon?: string;
        label: string;
        detail?: string;
        /**
         * A pinned option is always shown first in the menu,
         * before unpinned items
         */
        pinned?: boolean;
    }
}
export interface IColors {
    getColor(colorName: string): string | null;
}
export declare namespace Plugin {
    namespace Diagnostics {
        interface Api {
            setErrors(key: string, fileName: string, errors: types.Diagnostic[]): void;
        }
    }
    interface Api extends EventEmitter {
        automation: Automation.Api;
        configuration: Configuration;
        contextMenu: any;
        diagnostics: Diagnostics.Api;
        editors: EditorManager;
        input: InputManager;
        language: any;
        log: any;
        menu: any;
        process: Process;
        statusBar: StatusBar;
        workspace: Workspace;
        windows: IWindowManager;
        colors: IColors;
    }
}
