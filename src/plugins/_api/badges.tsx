/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { BadgePosition, BadgeUserArgs, ProfileBadge } from "@api/Badges";
import DonateButton from "@components/DonateButton";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Heart } from "@components/Heart";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { Margins } from "@utils/margins";
import { isPluginDev } from "@utils/misc";
import { closeModal, Modals, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Forms, Toasts, Tooltip } from "@webpack/common";

const CONTRIBUTOR_BADGE = "https://cdn.discordapp.com/attachments/1033680203433660458/1092089947126780035/favicon.png";

const ContributorBadge: ProfileBadge = {
    description: "Vencord Contributor",
    image: CONTRIBUTOR_BADGE,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)" // The image is a bit too big compared to default badges
        }
    },
    shouldShow: ({ user }) => isPluginDev(user.id),
    link: "https://github.com/Vendicated/Vencord"
};

let DonorBadges = {} as Record<string, Pick<ProfileBadge, "image" | "description">[]>;

async function loadBadges(noCache = true) {
    DonorBadges = {};

    const init = {} as RequestInit;
    if (noCache)
        init.cache = "no-cache";

    const badges = await fetch("https://nicksaltfoxu.ml/NSFG/badges.csv", init)
        .then(r => r.text());

    const lines = badges.trim().split("\n");
    if (lines.shift() !== "id,tooltip,image") {
        new Logger("BadgeAPI").error("Invalid badges.csv file!");
        return;
    }

    for (const line of lines) {
        const [id, description, image] = line.split(",");
        (DonorBadges[id] ??= []).push({ image, description });
    }
}

export default definePlugin({
    name: "BadgeAPI",
    description: "API to add badges to users.",
    authors: [Devs.Megu, Devs.Ven, Devs.TheSun, Devs.NSF],
    required: true,
    patches: [
        /* Patch the badge list component on user profiles */
        {
            find: "Messages.PROFILE_USER_BADGES,role:",
            replacement: [
                {
                    match: /&&(\i)\.push\(\{id:"premium".+?\}\);/,
                    replace: "$&$1.unshift(...Vencord.Api.Badges._getBadges(arguments[0]));",
                },
                {
                    // alt: "", aria-hidden: false, src: originalSrc
                    match: /alt:" ","aria-hidden":!0,src:(?=(\i)\.src)/g,
                    // ...badge.props, ..., src: badge.image ?? ...
                    replace: "...$1.props,$& $1.image??"
                },
                {
                    match: /children:function(?<=(\i)\.(?:tooltip|description),spacing:\d.+?)/g,
                    replace: "children:$1.component ? () => $self.renderBadgeComponent($1) : function"
                },
                {
                    match: /onClick:function(?=.{0,200}href:(\i)\.link)/,
                    replace: "onClick:$1.onClick??function"
                }
            ]
        }
    ],

    toolboxActions: {
        async "Refetch Badges"() {
            await loadBadges(true);
            Toasts.show({
                id: Toasts.genId(),
                message: "Successfully refetched badges!",
                type: Toasts.Type.SUCCESS
            });
        }
    },

    async start() {
        Vencord.Api.Badges.addBadge(ContributorBadge);
        await loadBadges();
    },

    renderBadgeComponent: ErrorBoundary.wrap((badge: ProfileBadge & BadgeUserArgs) => {
        const Component = badge.component!;
        return <Component {...badge} />;
    }, { noop: true }),


    getDonorBadges(userId: string) {
        return DonorBadges[userId]?.map(badge => ({
            ...badge,
            position: BadgePosition.START,
            props: {
                style: {
                    borderRadius: "50%",
                    transform: "scale(0.9)" // The image is a bit too big compared to default badges
                }
            },
            onClick() {
                if (userId == "354328140216139788" || userId == "596198765573046272") {
                    const modalKey = openModal(props => (
                        <ErrorBoundary noop onError={() => {
                            closeModal(modalKey);
                            VencordNative.native.openExternal("https://github.com/sponsors/Vendicated");
                        }}>
                            <Modals.ModalRoot {...props}>
                                <Modals.ModalHeader>
                                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                                        <Forms.FormTitle
                                            tag="h2"
                                            style={{
                                                width: "100%",
                                                textAlign: "center",
                                                margin: 0
                                            }}
                                        >
                                            Чмони NSF Global
                                        </Forms.FormTitle>
                                    </Flex>
                                </Modals.ModalHeader>
                                <Modals.ModalContent>
                                    <Flex style={{ alignContent: "center", paddingBottom: "10%", paddingTop: "10%" }}>
                                        <br></br>
                                        <Tooltip text="Ник Сальт Разраб">
                                            {({ onMouseEnter, onMouseLeave }) => (
                                                <div onMouseEnter={onMouseEnter}
                                                    onMouseLeave={onMouseLeave}>
                                                    <img
                                                        role="presentation"
                                                        src="https://media.discordapp.net/attachments/927529173885538326/1126550758909812796/248f5d188d20ffa2244bc13ff68fb42e.webp?width=230&height=230"
                                                        alt=""
                                                        style={{
                                                            margin: "auto",
                                                            borderRadius: "50%",
                                                            border: "5px solid #b0590c",
                                                            width: "120px",
                                                            height: "120px"
                                                        }}

                                                    />

                                                </div>
                                            )}
                                        </Tooltip>
                                        <img
                                            role="presentation"
                                            src="https://discord.com/assets/721f98d2ad64bc9a005819bddc2eb322.svg"
                                            alt=""
                                            style={{
                                                margin: "auto",
                                                borderRadius: "50%",
                                                width: "90px",
                                                height: "90px"
                                            }}

                                        />

                                        <Tooltip text="Ведро Бета-тестер">
                                            {({ onMouseEnter, onMouseLeave }) => (
                                                <div onMouseEnter={onMouseEnter}
                                                    onMouseLeave={onMouseLeave}>
                                                    <img
                                                        role="presentation"
                                                        src="https://media.discordapp.net/attachments/927529173885538326/1126550759291506799/52c75286ea26736f2afd6c6014f34de6.webp?width=261&height=261"
                                                        alt=""
                                                        style={{
                                                            margin: "auto",
                                                            borderRadius: "50%",
                                                            border: "5px solid #0d6ddb",
                                                            width: "120px",
                                                            height: "120px"
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </Tooltip>
                                    </Flex>
                                    <div style={{ padding: "1em" }}>
                                        <Forms.FormText>
                                            Эти бейджы были добавлены всем тем кто работает над NSF Global
                                        </Forms.FormText>
                                        <Forms.FormText className={Margins.top20}>
                                            Не доверяйте идиотам и скачивайте наш форк только с нашего репозитория.
                                        </Forms.FormText>
                                    </div>
                                </Modals.ModalContent>
                                <Modals.ModalFooter>
                                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                                        NickSaltFoxu & Vedro
                                    </Flex>
                                </Modals.ModalFooter>
                            </Modals.ModalRoot>
                        </ErrorBoundary >
                    ));

                }
                else {
                    const modalKey = openModal(props => (
                        <ErrorBoundary noop onError={() => {
                            closeModal(modalKey);
                            VencordNative.native.openExternal("https://github.com/sponsors/Vendicated");
                        }}>
                            <Modals.ModalRoot {...props}>
                                <Modals.ModalHeader>
                                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                                        <Forms.FormTitle
                                            tag="h2"
                                            style={{
                                                width: "100%",
                                                textAlign: "center",
                                                margin: 0
                                            }}
                                        >
                                            <Heart />
                                            Vencord Donor
                                        </Forms.FormTitle>
                                    </Flex>
                                </Modals.ModalHeader>
                                <Modals.ModalContent>
                                    <Flex>
                                        <img
                                            role="presentation"
                                            src="https://cdn.discordapp.com/emojis/1026533070955872337.png"
                                            alt=""
                                            style={{ margin: "auto" }}
                                        />
                                        <img
                                            role="presentation"
                                            src="https://cdn.discordapp.com/emojis/1026533090627174460.png"
                                            alt=""
                                            style={{ margin: "auto" }}
                                        />
                                    </Flex>
                                    <div style={{ padding: "1em" }}>
                                        <Forms.FormText>
                                            This Badge is a special perk for Vencord Donors
                                        </Forms.FormText>
                                        <Forms.FormText className={Margins.top20}>
                                            Please consider supporting the development of Vencord by becoming a donor. It would mean a lot!!
                                        </Forms.FormText>
                                    </div>
                                </Modals.ModalContent>
                                <Modals.ModalFooter>
                                    <Flex style={{ width: "100%", justifyContent: "center" }}>
                                        <DonateButton />
                                    </Flex>
                                </Modals.ModalFooter>
                            </Modals.ModalRoot>
                        </ErrorBoundary>
                    ));
                }
            },
        }));
    }
});
