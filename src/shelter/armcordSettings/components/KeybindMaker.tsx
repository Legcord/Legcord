const {
    ui: { ModalRoot, ModalBody, ModalConfirmFooter, ModalSizes, ModalHeader, TextBox },
} = shelter;
export const KeybindMaker = () => {
    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader
                close={() => {
                    null; //FIXME - IMPLEMENT
                }}
            >
                Add a keybind
            </ModalHeader>
            <ModalBody>
                <TextBox value="uhhh" />
            </ModalBody>
            <ModalConfirmFooter
                close={() => {
                    null; //FIXME - IMPLEMENT
                }}
            />
        </ModalRoot>
    );
};
