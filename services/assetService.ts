
import { UserAsset } from '../types';

const ASSET_STORAGE_KEY = 'treasure-hunt-user-assets';

const getAllAssets = (): UserAsset[] => {
    const data = localStorage.getItem(ASSET_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveAllAssets = (assets: UserAsset[]): void => {
    localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
};

export const saveUserAsset = (newAsset: UserAsset): void => {
    const allAssets = getAllAssets();
    allAssets.push(newAsset);
    saveAllAssets(allAssets);
};

export const getUserAssets = (userId: string): UserAsset[] => {
    const allAssets = getAllAssets();
    return allAssets
        .filter(asset => asset.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp); // Show newest first
};
