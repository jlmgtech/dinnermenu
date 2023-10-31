const slots = [];

export const push = (slot) => {
    slots.push(slot);
};

export const pop = () => {
    return slots.pop();
};

export const top = () => {
    return slots.at(-1);
};
