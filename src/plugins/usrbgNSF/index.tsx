/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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
import { definePluginSettings } from "@api/Settings";
import { enableStyle } from "@api/Styles";
import { Link } from "@components/Link";
import { Flex } from "@components/Flex";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Logger } from "@utils/Logger";
import style from "./index.css?managed";


let data = {} as Record<string, string>;

const settings = definePluginSettings({
    nitroFirst: {
        description: "Banner to use if both Nitro and USRBG/NSF Global banners are present.",
        type: OptionType.SELECT,
        options: [
            { label: "Nitro banner", value: true, default: true },
            { label: "NSF Global banner", value: false }
        ]
    },
    bruhURL: {
        description: "Enter NSF Global url here if you choosed it",
        type: OptionType.STRING,
        default: "https://nicksaltfoxu.ml/NSFG/userList.json"
    },
    voiceBackground: {
        description: "Use USRBG banners as voice chat backgrounds",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "USRBG NSF FORK",
    description: "Displays user banners from USRBG, allowing anyone to get a banner without Nitro",
    authors: [Devs.AutumnVN, Devs.pylix, Devs.TheKodeToad],
    settings,
    patches: [
        {
            find: ".NITRO_BANNER,",
            replacement: [
                {
                    match: /(\i)\.premiumType/,
                    replace: "$self.premiumHook($1)||$&"
                },
                {
                    match: /(\i)\.bannerSrc,/,
                    replace: "$self.useBannerHook($1),"
                },
                {
                    match: /\?\(0,\i\.jsx\)\(\i,{type:\i,shown/,
                    replace: "&&$self.shouldShowBadge(arguments[0])$&"
                }
            ]
        },
        {
            find: "\"data-selenium-video-tile\":",
            predicate: () => settings.store.voiceBackground,
            replacement: [
                {
                    match: /(\i)\.style,/,
                    replace: "$self.voiceBackgroundHook($1),"
                }
            ]
        }
    ],

    settingsAboutComponent: () => {
        return (
            <Flex style={{ color: "#FFFFFF" ,width: "100%", justifyContent: "center" }}>
            If you're using NSF Global - there is no problems
            ~~<Link href="https://github.com/AutumnVN/usrbg#how-to-request-your-own-usrbg-banner">USRBG - CLICK HERE TO GET YOUR OWN BANNER</Link>~~
            </Flex>
        );
    },

    voiceBackgroundHook({ className, participantUserId }: any) {
        if (className.includes("tile-")) {
            if (data[participantUserId]) {
                return {
                    backgroundImage: `url(${data[participantUserId]})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                };
            }
        }
    },

    useBannerHook({ displayProfile, user }: any) {
        if (displayProfile?.banner && settings.store.nitroFirst) return;
        if (data[user.id]) return data[user.id];
    },

    premiumHook({ userId }: any) {
        if (data[userId]) return 2;
    },

    shouldShowBadge({ displayProfile, user }: any) {
        return displayProfile?.banner && (!data[user.id] || settings.store.nitroFirst);
    },

    async start() {
        enableStyle(style);
            
            const res = await fetch(settings.store.bruhURL);
            if (res.ok)
                data = await res.json();

        }


});
