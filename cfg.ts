/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface Repository {
    name: string;
    url: string;
}

export interface RepositoryMeta {
    name: string;
    description?: string;
    version?: string;
}

export interface Character {
    id: string;
    name: string;
    character: string;
    img: string;
    color: string;
    // defaultText is ignored - we don't use it at all
}

// Enhanced character interface with repository context
export interface EnhancedCharacter extends Character {
    uniqueId: string; // Repository name + character ID
    repositoryName: string;
}

export const DEFAULT_REPOSITORIES: Repository[] = [
    {
        name: "Default",
        url: "https://raw.githubusercontent.com/ItsLogic/SekaiPlus/refs/heads/sekai/"
    }
];

export const buildAssetUrl = (repoUrl: string, path: string): string => {
    return `${repoUrl}/${path}`;
};

// Default text settings - always used, never from JSON
export const DEFAULT_TEXT_SETTINGS = {
    text: "奏でーかわいい",
    x: 148,
    y: 128,
    s: 24,
    r: 0
};

// Helper function to create enhanced character with unique ID
export function createEnhancedCharacter(character: Character, repositoryName: string): EnhancedCharacter {
    return {
        id: character.id,
        name: character.name,
        character: character.character,
        img: character.img,
        color: character.color,
        uniqueId: `${repositoryName}:${character.id}`,
        repositoryName
    };
}