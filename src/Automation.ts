/**
 * Automation API definition
 *
 * The Automation API provides a set of utilities
 * geared towards testing Oni's functionality.
 */

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
    waitFor(condition: WaitConditionChecker, timeout: number): Promise<void>

    // Wait for an editor to be initialized
    waitForEditors(): Promise<void>
}
