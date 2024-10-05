const {
    ui: { ModalRoot, ModalBody, ModalConfirmFooter, ModalSizes, ModalHeader, TextBox },
} = shelter;
export const KeybindMaker = () => {
    return (
        <ModalRoot size={ModalSizes.SMALL}>
            <ModalHeader>Add a keybind</ModalHeader>
            <ModalBody>
                <TextBox />
            </ModalBody>
            <ModalConfirmFooter />
        </ModalRoot>
    );
};
