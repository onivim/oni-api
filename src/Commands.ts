/**
 * Commands.ts
 *
 * API surface area for registering and executing commands
 */

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
