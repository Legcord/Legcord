import type { Accessor, JSX, ParentProps } from "solid-js";
import { createContext, Show, useContext } from "solid-js";

const SearchQueryContext = createContext<Accessor<string>>(() => "");

export function SettingsSearchProvider(props: ParentProps<{ query: Accessor<string> }>) {
    return <SearchQueryContext.Provider value={props.query}>{props.children}</SearchQueryContext.Provider>;
}

export function useSettingsSearchQuery(): Accessor<string> {
    return useContext(SearchQueryContext);
}

export function matchesSettingsQuery(keywords: Array<string | undefined | null>, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return keywords.some((keyword) => {
        if (!keyword) return false;
        return keyword.toLowerCase().includes(q);
    });
}

export function SearchableSetting(props: { keywords: Array<string | undefined | null>; children: JSX.Element }) {
    const query = useSettingsSearchQuery();
    return <Show when={matchesSettingsQuery(props.keywords, query())}>{props.children}</Show>;
}
