import { useCallback } from 'react';

export const useFolderDialog = () => {
    const openFolderDialog = useCallback(async (defaultPath = '') => {
        try {
            let path;
            
            if (defaultPath) {
                path = await window.go.main.App.OpenFolderDialogWithDefault(defaultPath);
            } else {
                path = await window.go.main.App.OpenFolderDialog();
            }
            
            return path;
        } catch (error) {
            console.error('Ошибка при выборе папки:', error);
            return '';
        }
    }, []);

    return { openFolderDialog };
};