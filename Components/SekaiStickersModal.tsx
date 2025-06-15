/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, ChannelStore, Forms, React, SelectedChannelStore, Slider, Switch, Text, TextArea, UploadHandler } from "@webpack/common";

import { buildAssetUrl, DEFAULT_TEXT_SETTINGS, EnhancedCharacter } from "../cfg";
import { repositoryManager, RepositoryData } from "../utils/repositoryManager";
import Canvas from "./Canvas";
import CharSelectModal from "./Picker";

export default function SekaiStickersModal({ modalProps, settings }: { modalProps: ModalProps; settings: any; }) {
    const [text, setText] = React.useState<string>(DEFAULT_TEXT_SETTINGS.text);
    const [selectedRepo, setSelectedRepo] = React.useState<RepositoryData | null>(null);
    const [character, setCharacter] = React.useState<EnhancedCharacter | null>(null);
    const [fontSize, setFontSize] = React.useState<number>(DEFAULT_TEXT_SETTINGS.s);
    const [rotate, setRotate] = React.useState<number>(DEFAULT_TEXT_SETTINGS.r);
    const [curve, setCurve] = React.useState<boolean>(false);
    const [isImgLoaded, setImgLoaded] = React.useState<boolean>(false);
    const [position, setPosition] = React.useState<{ x: number, y: number; }>({ 
        x: DEFAULT_TEXT_SETTINGS.x, 
        y: DEFAULT_TEXT_SETTINGS.y 
    });
    const [spaceSize, setSpaceSize] = React.useState<number>(36);
    
    const repositories = repositoryManager.getAllRepositories();
    let canvast!: HTMLCanvasElement;
    const imgRef = React.useRef<HTMLImageElement>(new Image());

    // Initialize with first available repository and character
    React.useEffect(() => {
        if (repositories.length > 0 && !selectedRepo) {
            const firstRepo = repositories[0];
            setSelectedRepo(firstRepo);
            if (firstRepo.characters.length > 0) {
                const firstChar = firstRepo.characters[0];
                setCharacter(firstChar);
                setText(DEFAULT_TEXT_SETTINGS.text);
                setPosition({ x: DEFAULT_TEXT_SETTINGS.x, y: DEFAULT_TEXT_SETTINGS.y });
                setFontSize(DEFAULT_TEXT_SETTINGS.s);
                setRotate(DEFAULT_TEXT_SETTINGS.r);
            }
        }
    }, [repositories]);

    // Update image when character changes
    React.useEffect(() => {
        if (character && selectedRepo) {
            setImgLoaded(false);
            const img = imgRef.current;
            
            img.onload = null;
            img.onerror = null;
            
            img.onload = () => {
                setImgLoaded(true);
            };
            
            img.onerror = () => {
                setImgLoaded(false);
            };
            
            const imageUrl = character.img.startsWith('stickers/') 
                ? buildAssetUrl(selectedRepo.repository.url, character.img)
                : buildAssetUrl(selectedRepo.repository.url, `stickers/${character.img}`);
            
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
        }
    }, [character, selectedRepo]);

    const angle = (Math.PI * text.length) / 7;

    const draw = ctx => {
        ctx.canvas.width = 296;
        ctx.canvas.height = 256;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (isImgLoaded && character && document.fonts.check("12px YurukaStd")) {
            const img = imgRef.current;
            
            try {
                if (img.width === 0 || img.height === 0) {
                    throw new Error("Image has invalid dimensions");
                }
                
                const hRatio = ctx.canvas.width / img.width;
                const vRatio = ctx.canvas.height / img.height;
                const ratio = Math.min(hRatio, vRatio);
                const centerShiftX = (ctx.canvas.width - img.width * ratio) / 2;
                const centerShiftY = (ctx.canvas.height - img.height * ratio) / 2;
                
                ctx.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    centerShiftX,
                    centerShiftY,
                    img.width * ratio,
                    img.height * ratio
                );
                
                ctx.font = `${fontSize}px YurukaStd, SSFangTangTi`;
                ctx.lineWidth = 9;
                ctx.save();

                ctx.translate(position.x, position.y);
                ctx.rotate(rotate / 10);
                ctx.textAlign = "center";
                ctx.strokeStyle = "white";
                ctx.fillStyle = character.color;
                
                const lines = text.split("\n");
                if (curve) {
                    for (const line of lines) {
                        for (let i = 0; i < line.length; i++) {
                            ctx.rotate(angle / line.length / 2.5);
                            ctx.save();
                            ctx.translate(0, -1 * fontSize * 3.5);
                            ctx.strokeText(line[i], 0, -1 * spaceSize);
                            ctx.fillText(line[i], 0, -1 * spaceSize);
                            ctx.restore();
                        }
                    }
                } else {
                    for (let i = 0, k = 0; i < lines.length; i++) {
                        ctx.strokeText(lines[i], 0, k);
                        ctx.fillText(lines[i], 0, k);
                        k += spaceSize;
                    }
                }
                ctx.restore();
                canvast = ctx.canvas;
            } catch (error) {
                ctx.fillStyle = "var(--background-primary)";
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.fillStyle = "var(--text-danger)";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText("Failed to draw image", ctx.canvas.width / 2, ctx.canvas.height / 2);
            }
        } else {
            ctx.fillStyle = "var(--background-secondary)";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = "var(--text-muted)";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            
            if (!character) {
                ctx.fillText("Select a character", ctx.canvas.width / 2, ctx.canvas.height / 2);
            } else if (!isImgLoaded) {
                ctx.fillText("Loading image...", ctx.canvas.width / 2, ctx.canvas.height / 2);
            } else if (!document.fonts.check("12px YurukaStd")) {
                ctx.fillText("Loading fonts...", ctx.canvas.width / 2, ctx.canvas.height / 2);
            }
        }
    };

    if (repositories.length === 0) {
        return (
            <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
                <ModalHeader>
                    <Text variant="heading-lg/bold" style={{ flexGrow: 1 }}>SekaiPlus</Text>
                    <ModalCloseButton onClick={modalProps.onClose} />
                </ModalHeader>
                <ModalContent>
                    <Text>No repositories loaded. Please check your repository configuration.</Text>
                </ModalContent>
            </ModalRoot>
        );
    }

    return (
        <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
            <ModalHeader>
                <Text variant="heading-lg/bold" style={{ flexGrow: 1 }}>SekaiPlus</Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <Flex flexDirection="row" style={{ paddingTop: 12 }}>
                    <div style={{ marginRight: 30 }}>
                        <Canvas draw={draw} id="SekaiCard_Canvas" />
                        <Forms.FormTitle>Text Y Pos</Forms.FormTitle>
                        <Slider 
                            minValue={0} 
                            maxValue={256} 
                            asValueChanges={va => { 
                                va = Math.round(va); 
                                setPosition({ x: position.x, y: curve ? 256 + fontSize * 3 - va : 256 - va }); 
                            }} 
                            initialValue={curve ? 256 - position.y + fontSize * 3 : 256 - position.y} 
                            orientation={"vertical"} 
                            onValueRender={va => String(Math.round(va))} 
                        />
                        <Forms.FormTitle>Text X Pos</Forms.FormTitle>
                        <Slider 
                            minValue={0} 
                            maxValue={296} 
                            asValueChanges={va => { 
                                va = Math.round(va); 
                                setPosition({ y: position.y, x: va }); 
                            }} 
                            initialValue={position.x} 
                            orientation={"horizontal"} 
                            onValueRender={(v: number) => String(Math.round(v))} 
                        />
                        
                        {/* Character Info Display */}
                        {selectedRepo && character && (
                            <div style={{ 
                                marginTop: 16,
                                padding: 12,
                                backgroundColor: "var(--background-secondary)",
                                borderRadius: 8,
                                border: "1px solid var(--background-accent)"
                            }}>
                                <Text variant="text-md/semibold" style={{ 
                                    color: "var(--text-normal)",
                                    marginBottom: 4,
                                    display: "block"
                                }}>
                                    {character.name}
                                </Text>
                                <Text variant="text-sm/normal" style={{ 
                                    color: "var(--text-muted)",
                                    display: "block"
                                }}>
                                    Repository: {selectedRepo.meta.name}
                                </Text>
                            </div>
                        )}
                    </div>
                    <div style={{ marginRight: 10, width: "30vw" }}>
                        <Forms.FormTitle>Text</Forms.FormTitle>
                        <TextArea onChange={setText} value={text} rows={4} spellCheck={false} />
                        <Forms.FormTitle>Rotation</Forms.FormTitle>
                        <Slider 
                            markers={[-10, -5, 0, 5, 10]} 
                            stickToMarkers={false} 
                            minValue={-10} 
                            maxValue={10} 
                            asValueChanges={val => setRotate(val)} 
                            initialValue={rotate} 
                            keyboardStep={0.2} 
                            orientation={"horizontal"} 
                            onValueRender={(v: number) => String(v.toFixed(2))} 
                        />
                        <Forms.FormTitle>Font Size</Forms.FormTitle>
                        <Slider 
                            minValue={10} 
                            asValueChanges={val => setFontSize(Math.round(val))} 
                            maxValue={100} 
                            initialValue={fontSize} 
                            keyboardStep={1} 
                            orientation={"horizontal"} 
                            onValueRender={(v: number) => String(Math.round(v))} 
                        />
                        <Forms.FormTitle>Spacing</Forms.FormTitle>
                        <Slider 
                            markers={[18, 36, 72, 100]} 
                            stickToMarkers={false} 
                            minValue={18} 
                            maxValue={100} 
                            initialValue={spaceSize} 
                            asValueChanges={e => setSpaceSize(e)} 
                            onValueRender={e => String(Math.round(e))} 
                        />
                        <Switch value={curve} onChange={val => setCurve(val)}>Enable curve</Switch>
                        <Button onClick={() => openModal(props => 
                            <CharSelectModal 
                                modalProps={props} 
                                repositories={repositories}
                                onCharacterSelect={(repo, char) => {
                                    setSelectedRepo(repo);
                                    setCharacter(char);
                                }}
                            />
                        )}>Switch Character</Button>
                    </div>
                </Flex>
            </ModalContent>
            <ModalFooter>
                <Flex flexDirection="row" style={{ gap: 12 }}>
                    <Button onClick={() => {
                        if (settings.store.AutoCloseModal) modalProps.onClose();
                        if (character && selectedRepo) {
                            canvast.toBlob(blob => {
                                const repoName = selectedRepo.meta.name.replace(/[^a-zA-Z0-9]/g, '_');
                                const fileName = `${repoName}_${character.character}_${character.id}.png`;
                                const file = new File([blob as Blob], fileName, { type: "image/png" });
                                UploadHandler.promptToUpload([file], ChannelStore.getChannel(SelectedChannelStore.getChannelId()), 0);
                            });
                        }
                    }} disabled={!character || !isImgLoaded}>Upload as Attachment</Button>
                </Flex>
            </ModalFooter>
        </ModalRoot>
    );
}