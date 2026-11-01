/**
 * Adds "Open in New Window" to channel context menus.
 * A copied DOM row is visible but Discord will not hover or activate it, so
 * the item is a real Vencord menu item when that API is available.
 */
var MENU_IDS = ["channel-context", "thread-context", "gdm-context"];

function channelFromProps(props) {
    var channel = props && props.channel ? props.channel : props;
    if (!channel || typeof channel.id !== "string" || !/^\d{15,25}$/.test(channel.id)) return null;
    if (typeof channel.type !== "number") return null;
    if (channel.author || channel.channel_id) return null;
    var guildId = channel.guild_id || channel.guildId;
    if (guildId == null || guildId === "") guildId = "@me";
    return { guildId: String(guildId), channelId: channel.id };
}

function channelFromMenuArgs(args) {
    var i, channel;
    for (i = 0; i < args.length; i++) {
        channel = channelFromProps(args[i]);
        if (channel) return channel;
    }
    return null;
}

module.exports.channelFromProps = channelFromProps;
module.exports.activate = function (api) {
    var pending = null;
    var watcher = null;
    var vencordReady = false;
    var removePatch = null;
    var poll = null;
    var warned = false;
    var lastOpen = 0;

    function allowedOrigin(origin) {
        return (
            origin === "https://discord.com" ||
            origin === "https://canary.discord.com" ||
            origin === "https://ptb.discord.com"
        );
    }

    function parseChannelHref(href) {
        if (!href) return null;
        var match = String(href).match(/\/channels\/(@me|\d+)\/(\d{15,25})/);
        if (!match) return null;
        return { guildId: match[1], channelId: match[2] };
    }

    function channelFromTarget(target) {
        var node = target;
        while (node && node !== document) {
            if (node.getAttribute) {
                var parsed = parseChannelHref(node.getAttribute("href"));
                if (parsed) return parsed;
            }
            node = node.parentElement;
        }
        return null;
    }

    function openChannel(channel) {
        var now = Date.now();
        if (now - lastOpen < 500) return;
        lastOpen = now;
        var origin = allowedOrigin(location.origin) ? location.origin : "https://discord.com";
        var url =
            origin +
            "/channels/" +
            channel.guildId +
            "/" +
            channel.channelId +
            "?legcord_channel_popout=1";
        window.open(url);
        api.logger.log("requested", channel.channelId);
    }

    function closeMenu() {
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Escape",
                code: "Escape",
                keyCode: 27,
                which: 27,
                bubbles: true,
                cancelable: true,
            }),
        );
    }

    function onMenu(children) {
        var channel = channelFromMenuArgs(Array.prototype.slice.call(arguments, 1));
        if (!channel) {
            if (!warned) {
                warned = true;
                api.logger.warn("channel menu did not include a channel");
            }
            return;
        }
        var index;
        for (index = 0; index < children.length; index++) {
            if (children[index] && children[index].props && children[index].props.id === "legcord-channel-popout") {
                return;
            }
        }
        var Common = window.Vencord.Webpack.Common;
        children.unshift(
            Common.React.createElement(Common.Menu.MenuItem, {
                id: "legcord-channel-popout",
                key: "legcord-channel-popout",
                label: "Open in New Window",
                action: function () {
                    openChannel(channel);
                },
            }),
        );
    }

    function installVencord() {
        var Vencord = window.Vencord;
        var menuApi = Vencord && Vencord.Api && Vencord.Api.ContextMenu;
        var Common = Vencord && Vencord.Webpack && Vencord.Webpack.Common;
        if (!menuApi || !menuApi.addContextMenuPatch || !Common || !Common.React || !Common.Menu || !Common.Menu.MenuItem) {
            return false;
        }
        menuApi.addContextMenuPatch(MENU_IDS, onMenu);
        removePatch = function () {
            menuApi.removeContextMenuPatch(MENU_IDS, onMenu);
        };
        vencordReady = true;
        var stray = document.getElementById("legcord-channel-popout-item");
        if (stray) stray.remove();
        api.logger.log("using Vencord context menu");
        return true;
    }

    function sampleItem(menu) {
        var items = menu.querySelectorAll('[role="menuitem"]');
        var i;
        for (i = 0; i < items.length; i++) {
            var cls = String(items[i].className || "");
            var disabled = items[i].getAttribute("aria-disabled") === "true";
            if (!disabled && cls.toLowerCase().indexOf("disabled") === -1 && cls.indexOf("danger") === -1 && cls.indexOf("Danger") === -1) {
                return items[i];
            }
        }
        return items[0] || null;
    }

    function injectItem(menu, channel) {
        if (vencordReady || !menu || menu.querySelector("#legcord-channel-popout-item")) return false;
        var sample = sampleItem(menu);
        if (!sample || !sample.parentElement) return false;

        var item = sample.cloneNode(true);
        item.id = "legcord-channel-popout-item";
        item.__legcordChannel = channel;
        item.removeAttribute("aria-disabled");
        item.tabIndex = 0;
        item.style.pointerEvents = "auto";
        item.style.cursor = "pointer";
        var icons = item.querySelectorAll("svg");
        var i;
        for (i = 0; i < icons.length; i++) icons[i].remove();
        var label = item.querySelector('[class*="label"]') || item;
        label.textContent = "Open in New Window";
        if (label.style) label.style.pointerEvents = "none";
        sample.parentElement.insertBefore(item, sample.parentElement.firstChild);
        return true;
    }

    function onPointerUp(event) {
        var node = event.target;
        if (!node || !node.closest) return;
        var item = node.closest("#legcord-channel-popout-item");
        if (!item || !item.__legcordChannel) return;
        event.preventDefault();
        event.stopPropagation();
        openChannel(item.__legcordChannel);
        closeMenu();
    }

    function stopWatching() {
        if (watcher) watcher.disconnect();
        watcher = null;
        pending = null;
    }

    function watchForMenu() {
        if (watcher) watcher.disconnect();
        var sawMenu = false;
        watcher = new MutationObserver(function () {
            if (!pending || vencordReady) return;
            var menus = document.querySelectorAll('[role="menu"]');
            if (!menus.length) {
                if (sawMenu) stopWatching();
                return;
            }
            sawMenu = true;
            injectItem(menus[0], pending);
        });
        watcher.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(function () {
            if (!sawMenu) stopWatching();
        }, 1500);
    }

    var previous = globalThis.__legcordChannelPopout;
    if (previous && previous.detach) previous.detach();

    function onContextMenu(event) {
        if (vencordReady) return;
        var channel = channelFromTarget(event.target);
        if (!channel) return;
        pending = channel;
        watchForMenu();
    }

    function detach() {
        if (poll) clearInterval(poll);
        document.removeEventListener("contextmenu", onContextMenu, true);
        document.removeEventListener("pointerup", onPointerUp, true);
        document.removeEventListener("click", onPointerUp, true);
        if (removePatch) removePatch();
        if (watcher) watcher.disconnect();
        watcher = null;
        pending = null;
        vencordReady = false;
        var existing = document.getElementById("legcord-channel-popout-item");
        if (existing) existing.remove();
    }

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("click", onPointerUp, true);
    globalThis.__legcordChannelPopout = { detach: detach };
    if (typeof api.onCleanup === "function") api.onCleanup(detach);

    if (!installVencord()) {
        poll = setInterval(function () {
            if (installVencord()) clearInterval(poll);
        }, 200);
        setTimeout(function () {
            if (poll) clearInterval(poll);
        }, 20000);
    }

    api.logger.log("renderer entry active");
};
