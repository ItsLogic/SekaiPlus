/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize } from "@utils/modal";
import { React, ScrollerThin, Text, TextInput } from "@webpack/common";

import { buildAssetUrl, Character } from "../cfg";
import { RepositoryData } from "../utils/repositoryManager";

interface CharSelectModalProps {
    modalProps: ModalProps;
    repositories: RepositoryData[];
    onCharacterSelect: (repo: RepositoryData, character: Character) => void;
}

export default function CharSelectModal({ modalProps, repositories, onCharacterSelect }: CharSelectModalProps) {
    const [search, setSearch] = React.useState<string>("");
    const [activeTab, setActiveTab] = React.useState<number>(0);

    const currentRepo = repositories[activeTab];

    // Calculate grid columns based on window width
    const getGridColumns = () => {
        const windowWidth = window.innerWidth;
        if (windowWidth < 768) return 2; // Mobile
        if (windowWidth < 1024) return 3; // Tablet
        if (windowWidth < 1440) return 4; // Small desktop
        return 5; // Large desktop
    };

    const [gridColumns, setGridColumns] = React.useState(getGridColumns());

    // Update grid columns on window resize
    React.useEffect(() => {
        const handleResize = () => {
            setGridColumns(getGridColumns());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const memoedSearchChar = React.useMemo(() => {
        if (!currentRepo) return [];
        
        const s = search.toLowerCase();
        return currentRepo.characters.map((character, index) => {
            if (
                s === "" || // Show all if no search term
                s === character.id ||
                character.name.toLowerCase().includes(s) ||
                character.character.toLowerCase().includes(s)
            ) {
                return (
                    <div
                        key={`${activeTab}-${index}`}
                        onClick={() => { 
                            modalProps.onClose(); 
                            onCharacterSelect(currentRepo, character);
                        }}
                        style={{
                            cursor: "pointer",
                            borderRadius: "8px",
                            overflow: "hidden",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            backgroundColor: "var(--background-secondary)",
                            border: "1px solid var(--background-accent)",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <img 
                            src={buildAssetUrl(currentRepo.repository.url, `stickers/${character.img}`)}
                            loading="lazy"
                            alt={character.name}
                            style={{ 
                                width: "100%",
                                height: "auto",
                                aspectRatio: "1",
                                objectFit: "cover",
                                display: "block"
                            }}
                        />
                        <div style={{
                            padding: "8px",
                            textAlign: "center"
                        }}>
                            <Text variant="text-sm/semibold" style={{ color: "var(--text-normal)" }}>
                                {character.name}
                            </Text>
                        </div>
                    </div>
                );
            }
            return null;
        }).filter(Boolean);
    }, [search, currentRepo, activeTab]);

    if (repositories.length === 0) {
        return (
            <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
                <ModalHeader>
                    <Text variant="heading-lg/bold" style={{ flexGrow: 1 }}>No Repositories Available</Text>
                    <ModalCloseButton onClick={modalProps.onClose} />
                </ModalHeader>
                <ModalContent>
                    <Text>No character repositories have been loaded.</Text>
                </ModalContent>
            </ModalRoot>
        );
    }

    return (
        <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
            <ModalHeader>
                <Text variant="heading-lg/bold" style={{ flexGrow: 1 }}>Select Character</Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <Flex flexDirection="column" style={{ paddingTop: 12 }}>
                    {/* Repository Tabs */}
                    <div style={{ 
                        display: "flex", 
                        marginBottom: 12, 
                        borderBottom: "1px solid var(--background-accent)",
                        overflowX: "auto"
                    }}>
                        {repositories.map((repo, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setActiveTab(index);
                                    setSearch(""); // Clear search when switching tabs
                                }}
                                style={{
                                    padding: "8px 16px",
                                    background: activeTab === index ? "var(--brand-experiment)" : "transparent",
                                    color: activeTab === index ? "white" : "var(--text-normal)",
                                    border: "none",
                                    borderRadius: "4px 4px 0 0",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    minWidth: "fit-content"
                                }}
                            >
                                {repo.meta.name}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <TextInput 
                        placeholder={`Search in ${currentRepo?.meta.name || 'repository'}...`}
                        onChange={(e: string) => setSearch(e)} 
                        value={search}
                        style={{ marginBottom: 12 }}
                    />

                    {/* Character Grid */}
                    <ScrollerThin style={{ height: 520 }}>
                        <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                            gap: 12,
                            padding: 4
                        }}>
                            {memoedSearchChar}
                        </div>
                        {memoedSearchChar.length === 0 && search && (
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "center", 
                                alignItems: "center", 
                                height: "200px" 
                            }}>
                                <Text variant="text-md/normal" style={{ color: "var(--text-muted)" }}>
                                    No characters found matching "{search}"
                                </Text>
                            </div>
                        )}
                    </ScrollerThin>
                </Flex>
            </ModalContent>
        </ModalRoot>
    );
}