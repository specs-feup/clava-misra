/**
 * Key-value storage to share data between visits
 * 
 *  @template T Type of the stored values
 */
export default class Context<T> {
    protected storage: Map<string, T> = new Map();

    put(key: string, value: T) {
        this.storage.set(key, value);
    }

    get(key: string): T | undefined {
        return this.storage.get(key);
    } 
}