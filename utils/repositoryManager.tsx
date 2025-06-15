/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";

import { buildAssetUrl, Character, createEnhancedCharacter, EnhancedCharacter, Repository, RepositoryMeta } from "../cfg";

export interface RepositoryData {
    meta: RepositoryMeta;
    characters: EnhancedCharacter[];
    repository: Repository;
}

class RepositoryManager {
    private repositories: Map<string, RepositoryData> = new Map();
    private loadingPromises: Map<string, Promise<RepositoryData | null>> = new Map();
    private changeListeners: Set<() => void> = new Set();
    private characterIndex: Map<string, EnhancedCharacter> = new Map();

    addChangeListener(listener: () => void) {
        this.changeListeners.add(listener);
    }

    removeChangeListener(listener: () => void) {
        this.changeListeners.delete(listener);
    }

    private notifyChange() {
        this.changeListeners.forEach(listener => listener());
    }

    async loadRepository(repository: Repository): Promise<RepositoryData | null> {
        const key = repository.url;
        
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key)!;
        }

        if (this.repositories.has(key)) {
            return this.repositories.get(key)!;
        }

        const loadPromise = this._loadRepositoryData(repository, key);
        this.loadingPromises.set(key, loadPromise);

        try {
            const result = await loadPromise;
            if (result) {
                this.repositories.set(key, result);
                this._updateCharacterIndex();
                this.notifyChange();
            }
            return result;
        } finally {
            this.loadingPromises.delete(key);
        }
    }

    private async _loadRepositoryData(repository: Repository, key: string): Promise<RepositoryData | null> {
        try {
            const metaUrl = buildAssetUrl(repository.url, "meta.json");
            const metaResponse = await fetch(metaUrl, { cache: "no-cache" });
            
            if (!metaResponse.ok) {
                throw new Error(`Failed to load meta.json: ${metaResponse.statusText}`);
            }

            const meta: RepositoryMeta = await metaResponse.json();

            const charactersUrl = buildAssetUrl(repository.url, "characters.json");
            const charactersResponse = await fetch(charactersUrl, { cache: "no-cache" });
            
            if (!charactersResponse.ok) {
                throw new Error(`Failed to load characters.json: ${charactersResponse.statusText}`);
            }

            const rawCharacters: Character[] = await charactersResponse.json();
            
            const enhancedCharacters = rawCharacters.map(char => {
                const cleanChar: Character = {
                    id: char.id,
                    name: char.name,
                    character: char.character,
                    img: char.img,
                    color: char.color
                };
                return createEnhancedCharacter(cleanChar, meta.name);
            });

            return {
                meta,
                characters: enhancedCharacters,
                repository
            };
        } catch (error) {
            console.error(`Failed to load repository ${repository.name}:`, error);
            showNotification({
                title: "Repository Load Error",
                body: `Failed to load repository "${repository.name}": ${error.message}`,
                permanent: false,
                noPersist: true,
            });
            return null;
        }
    }

    private _updateCharacterIndex() {
        this.characterIndex.clear();
        
        for (const repoData of this.repositories.values()) {
            for (const character of repoData.characters) {
                this.characterIndex.set(character.uniqueId, character);
            }
        }
    }

    getAllRepositories(): RepositoryData[] {
        return Array.from(this.repositories.values());
    }

    getRepository(key: string): RepositoryData | null {
        return this.repositories.get(key) || null;
    }

    getCharacterByUniqueId(uniqueId: string): EnhancedCharacter | null {
        return this.characterIndex.get(uniqueId) || null;
    }

    searchCharacters(query: string): EnhancedCharacter[] {
        const results: EnhancedCharacter[] = [];
        const searchTerm = query.toLowerCase();
        
        for (const character of this.characterIndex.values()) {
            if (
                character.id.toLowerCase().includes(searchTerm) ||
                character.name.toLowerCase().includes(searchTerm) ||
                character.character.toLowerCase().includes(searchTerm) ||
                character.uniqueId.toLowerCase().includes(searchTerm)
            ) {
                results.push(character);
            }
        }
        
        return results;
    }

    clearCache(): void {
        this.repositories.clear();
        this.loadingPromises.clear();
        this.characterIndex.clear();
        this.notifyChange();
    }
}

export const repositoryManager = new RepositoryManager();