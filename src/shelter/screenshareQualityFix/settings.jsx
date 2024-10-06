const {
    plugin: { store },
    ui: { TextBox, Header, HeaderTags },
} = shelter;

export default () => (
    <>
        <Header tag={HeaderTags.H1}>Resolution</Header>
        <TextBox
            placeholder="720/1080/1440"
            value={Number.isSafeInteger(store.resolution) ? store.resolution : ""}
            onInput={(v) => {
                store.resolution = Number.parseInt(v);
            }}
        />
        <Header tag={HeaderTags.H1}>FPS</Header>
        <TextBox
            placeholder="15/30/60"
            value={Number.isSafeInteger(store.fps) ? store.fps : ""}
            onInput={(v) => {
                store.fps = Number.parseInt(v);
            }}
        />
    </>
);
