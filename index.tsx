/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton, ChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { DeleteIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { Button, Forms, React, TextInput, useState } from "@webpack/common";

import SekaiStickersModal from "./Components/SekaiStickersModal";
import { kanadeSvg } from "./kanade.svg";
import { repositoryManager } from "./utils/repositoryManager";
import { checkUpdate, updateButton } from "./utils/versionCheck";

interface Repository {
    metaUrl: string;
    name: string;
}

const makeEmptyRepository = (): Repository => ({
    metaUrl: "",
    name: ""
});

const makeEmptyRepositoryArray = () => [
    {
        metaUrl: "https://raw.githubusercontent.com/ItsLogic/SekaiPlus/refs/heads/sekai/meta.json",
        name: "Project Sekai Stickers"
    },
    makeEmptyRepository()
];

async function fetchRepositoryName(metaUrl: string): Promise<string | null> {
    try {
        const response = await fetch(metaUrl, { cache: "no-cache" });
        
        if (!response.ok) return null;
        
        const meta = await response.json();
        return meta.name || null;
    } catch {
        return null;
    }
}

function getBaseUrl(metaUrl: string): string {
    return metaUrl.replace('/meta.json', '');
}

async function reloadRepositories() {
    try {
        repositoryManager.clearCache();
        const repositories = settings.store.repositoryList || makeEmptyRepositoryArray();
        const validRepos = repositories.filter(repo => repo.metaUrl && repo.name);
        
        const repoData = validRepos.map(repo => ({
            name: repo.name,
            url: getBaseUrl(repo.metaUrl)
        }));
        
        await Promise.allSettled(repoData.map(repo => repositoryManager.loadRepository(repo)));
    } catch (error) {
        console.error("Failed to reload repositories:", error);
    }
}

function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={() => value !== initialValue && onChange(value)}
        />
    );
}

function RepositorySettings({ repositories }: { repositories: Repository[] }) {
    const [isLoading, setIsLoading] = React.useState<Set<number>>(new Set());

    async function onClickRemove(index: number) {
        if (index === repositories.length - 1) return;
        repositories.splice(index, 1);
        setIsLoading(new Set([...isLoading, -1]));
        await reloadRepositories();
        setIsLoading(prev => {
            const newSet = new Set(prev);
            newSet.delete(-1);
            return newSet;
        });
    }

    async function onChange(value: string, index: number, key: keyof Repository) {
        if (index === repositories.length - 1) {
            repositories.push(makeEmptyRepository());
        }

        repositories[index][key] = value;

        if (key === "metaUrl" && value.trim()) {
            setIsLoading(prev => new Set([...prev, index]));
            
            const fetchedName = await fetchRepositoryName(value);
            if (fetchedName) {
                repositories[index].name = fetchedName;
                await reloadRepositories();
            }
            
            setIsLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        }

        if (repositories[index].metaUrl === "" && 
            repositories[index].name === "" && 
            index !== repositories.length - 1) {
            repositories.splice(index, 1);
        }
    }

    return (
        <>
            <Forms.FormTitle tag="h4">Character Repositories</Forms.FormTitle>
            <Forms.FormText type={Forms.FormText.Types.DESCRIPTION}>
                Add direct URLs to meta.json files from repositories containing character stickers. 
                The repository name will be automatically fetched to confirm the URL is correct.
                <br /><br />
                <strong>Example:</strong> https://raw.githubusercontent.com/user/repo/main/meta.json
            </Forms.FormText>
            <Flex flexDirection="column" style={{ gap: "0.5em", marginTop: "1em" }}>
                {repositories.map((repo, index) => (
                    <React.Fragment key={`${repo.metaUrl}-${index}`}>
                        <Flex flexDirection="row" style={{ gap: "0.5em", alignItems: "flex-start" }}>
                            <Flex flexDirection="column" style={{ flexGrow: 1, gap: "0.5em" }}>
                                <Input
                                    placeholder="Direct URL to meta.json (e.g., https://raw.githubusercontent.com/user/repo/main/meta.json)"
                                    initialValue={repo.metaUrl}
                                    onChange={e => onChange(e, index, "metaUrl")}
                                />
                                <div style={{ 
                                    minHeight: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "4px 8px",
                                    backgroundColor: repo.name ? "var(--background-secondary)" : "var(--background-tertiary)",
                                    borderRadius: "4px",
                                    border: repo.name ? "1px solid var(--background-accent)" : "1px dashed var(--background-accent)"
                                }}>
                                    {isLoading.has(index) ? (
                                        <span style={{ 
                                            fontSize: "0.875rem", 
                                            color: "var(--text-muted)",
                                            fontStyle: "italic"
                                        }}>
                                            🔄 Fetching repository info...
                                        </span>
                                    ) : repo.name ? (
                                        <span style={{ 
                                            fontSize: "0.875rem", 
                                            color: "var(--text-normal)",
                                            fontWeight: "500"
                                        }}>
                                            ✅ {repo.name}
                                        </span>
                                    ) : repo.metaUrl ? (
                                        <span style={{ 
                                            fontSize: "0.875rem", 
                                            color: "var(--text-danger)"
                                        }}>
                                            ❌ Failed to fetch repository info
                                        </span>
                                    ) : (
                                        <span style={{ 
                                            fontSize: "0.875rem", 
                                            color: "var(--text-muted)",
                                            fontStyle: "italic"
                                        }}>
                                            Repository name will appear here
                                        </span>
                                    )}
                                </div>
                            </Flex>
                            <Button
                                size={Button.Sizes.MIN}
                                onClick={() => onClickRemove(index)}
                                disabled={isLoading.has(index)}
                                style={{
                                    background: "none",
                                    color: "var(--status-danger)",
                                    alignSelf: "flex-start",
                                    marginTop: "0px",
                                    ...(index === repositories.length - 1
                                        ? {
                                            visibility: "hidden",
                                            pointerEvents: "none"
                                        }
                                        : {}
                                    )
                                }}
                            >
                                <DeleteIcon />
                            </Button>
                        </Flex>
                    </React.Fragment>
                ))}
            </Flex>
            <Button
                onClick={async () => {
                    setIsLoading(prev => new Set([...prev, -1]));
                    await reloadRepositories();
                    setIsLoading(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(-1);
                        return newSet;
                    });
                }}
                disabled={isLoading.has(-1)}
                style={{ marginTop: "1em" }}
            >
                {isLoading.has(-1) ? "Reloading..." : "Reload All Repositories"}
            </Button>
        </>
    );
}

const settings = definePluginSettings({
    AutoCloseModal: {
        type: OptionType.BOOLEAN,
        description: "Auto close modal when done",
        default: true
    },
    repositories: {
        type: OptionType.COMPONENT,
        component: () => {
            const { repositoryList } = settings.use(["repositoryList"]);
            return <RepositorySettings repositories={repositoryList} />;
        }
    },
    repositoryList: {
        type: OptionType.CUSTOM,
        default: makeEmptyRepositoryArray(),
    },
    checkForUpdateOnStartUp: {
        type: OptionType.BOOLEAN,
        description: "Auto check for update on start up",
        default: true,
        placeholder: "Check update on start up",
    },
    checkForUpdate: {
        type: OptionType.COMPONENT,
        description: "Check for update",
        component: updateButton
    }
});

const SekaiStickerChatButton: ChatBarButton = () => {
    return (
        <ChatBarButton onClick={() => openModal(props => <SekaiStickersModal modalProps={props} settings={settings} />)} tooltip="SekaiPlus">
            {kanadeSvg()}
        </ChatBarButton>
    );
};

let IS_FONTS_LOADED = false;

// Define draff locally if not in main Devs
const Draff = {
    name: "Draff",
    id: 315923287953637377n  // Replace with actual Discord ID
};

export default definePlugin({
    name: "SekaiPlus",
    description: "A fork of Sekai Stickers with multiple improvements including repository support.",
    authors: [Devs.MaiKokain, Draff],
    dependencies: ["ChatInputButtonAPI"],
    settings,
    start: async () => {
        const fonts = [
            { name: "YurukaStd", url: "https://raw.githubusercontent.com/TheOriginalAyaka/sekai-stickers/main/src/fonts/YurukaStd.woff2" }, 
            { name: "SSFangTangTi", url: "https://raw.githubusercontent.com/TheOriginalAyaka/sekai-stickers/main/src/fonts/ShangShouFangTi.woff2" }
        ];
        
        if (!IS_FONTS_LOADED) {
            fonts.map(n => {
                new FontFace(n.name, `url(${n.url})`).load().then(
                    font => { document.fonts.add(font); },
                    err => { console.log(err); }
                );
            });
            IS_FONTS_LOADED = true;
        }

        await reloadRepositories();

        addChatBarButton("SekaiStickers", SekaiStickerChatButton);
        if (settings.store.checkForUpdateOnStartUp) await checkUpdate();
    },
    stop: () => {
        removeChatBarButton("SekaiStickers");
        repositoryManager.clearCache();
    }
});