// Временная заглушка для полного отключения RNFS операций
export class DisabledRNFS {
    static async exists(path: string): Promise<boolean> {
        console.log('🚫 [DisabledRNFS] exists() disabled for debugging');
        return false;
    }

    static async stat(path: string): Promise<any> {
        console.log('🚫 [DisabledRNFS] stat() disabled for debugging');
        return null;
    }

    static async unlink(path: string): Promise<void> {
        console.log('🚫 [DisabledRNFS] unlink() disabled for debugging');
    }

    static async mkdir(path: string): Promise<void> {
        console.log('🚫 [DisabledRNFS] mkdir() disabled for debugging');
    }

    static async readDir(path: string): Promise<any[]> {
        console.log('🚫 [DisabledRNFS] readDir() disabled for debugging');
        return [];
    }

    static async downloadFile(options: any): Promise<any> {
        console.log('🚫 [DisabledRNFS] downloadFile() disabled for debugging');
        throw new Error('Download disabled for debugging');
    }

    static get CachesDirectoryPath(): string {
        console.log('🚫 [DisabledRNFS] CachesDirectoryPath disabled for debugging');
        return '';
    }
}
