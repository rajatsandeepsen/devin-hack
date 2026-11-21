import { telegram } from "./telegram";

const { data, error } = await telegram("/setMyCommands", {
	body: {
		scope: { type: "all_private_chats" },
		commands: [
			{ command: "start", description: "set up language and interests" },
			{ command: "subscribe", description: "choose government update categories" },
			{ command: "subscriptions", description: "view your active subscriptions" },
			{ command: "unsubscribe", description: "remove all subscriptions" },
			{ command: "language", description: "change your preferred language" },
			{ command: "categories", description: "list available update categories" },
			{ command: "me", description: "view your Watch Bot profile" },
		],
	},
});

console.log({ data, error });
