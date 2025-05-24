export default class Context<T> {
    private storage: Map<string, T> = new Map();

    put(key: string, value: T) {
        this.storage.set(key, value);
    }

    get(key: string): T | undefined {
        return this.storage.get(key);
    } 
}