import { render } from "preact";
import PocketBase from 'pocketbase';
import Slot, {Stamp} from "slot";
import html from "html";
import { delay, Store } from "slot/utils";
const pb = new PocketBase('http://127.0.0.1:8090');
window.pb = pb;

const Auth = {};
const Ordering = {};
let main;
let cook;
let guest;

window.addEventListener("load", () => {
    render(html`<${Slot} flow=${main} />`, document.getElementById("app"));
});

main = ($) => 
    refreshAuth().then(user =>
    user 
    ? (console.log("user authd", user ), (user.isCook ? cook($) : Ordering.list($)))
    : (console.log("user not authd", user), Auth.auth($).then(user => 
        user
        ? (user.isCook ? cook($) : Ordering.list($))
        : main($)
    ))
);

Auth.auth = ($) => $.vmatch("log in", {
    signin: ($, usr, pwd) => attempt_signin($, usr, pwd),
    signup: ($) => Auth.signup($),
    reset: ($) => Auth.reset($),
});
Auth.signup = async ($) => $.vmatch("signup", {
    done: ($, name, email, password, password_confirm) => (createUser($, name, email, password, password_confirm)) ? null : signup($),
    cancel: () => null,
});
Auth.reset = async ($) => (await $.capture(() => html `
    <div> cannot reset your password at this time, because email provider has not been set up for this service. </div>
    <div> please contact your administrator for assistance. </div>
    <button class="btn btn-primary" onClick=${$.answer}>ok</button>
`)) && null;

Ordering.list = ($) => show_items($).then(() => 
    $.match({
        add: ($, dish) => Ordering.add($, dish).then(() => $.reset(Ordering.list)),
        edit: ($, dish) => Ordering.edit($, dish).then(() => $.reset(Ordering.list)),
        // delete from ticket_contents where dish = dish.id limit 1:
        delete: async ($, dish) => {
            const content = await pb.collection("ticket_contents").getList(0, 1, {
                filter: `dish = '${dish.id}'`,
            });
            if (content.items.length) {
                await pb.collection("ticket_contents").delete(content.items[0].id);
            }
            $.reset(Ordering.list);
        },
        submit: ($) => Ordering.thankyou($),
        cancel: ($) => Ordering.cancel($) ? null : Ordering.list($),
    })
);

Ordering.thankyou = async ($) => {
    $.show("submitting order");
    //const ticket = await get_or_create_ticket();
    return await $.vmatch("thank you!", {
        edit_order: ($) => Ordering.list($),
        logout: ($) => {
            pb.authStore.clear();
            $.reset(main);
        },
    });
};

async function get_or_create_ticket() {
    let tickets = await pb.collection("tickets").getList(0, 1, {
        sort: "-created",
    });
    if (tickets.items.length) {
        return tickets.items[0];
    }
    return await pb.collection("tickets").create({
        status: "active",
        user: pb.authStore.model.id,
    });
}

Ordering.add = async ($, dish) => {
    $.show("please wait");
    // get latest ticket that is active,
    // if none, then make a new ticket:
    let ticket = await get_or_create_ticket();

    // add dish to ticket:
    await pb.collection("ticket_contents").create({
        ticket: ticket.id,
        dish: dish.id,
    });
};


async function show_items($) {
    // for each dish, show the name, price, and a button to add to cart
    $.show("loading menu");
    const dishes = await pb.collection("dishes").getList(0, 100);

    $.show("loading your order");

    // get contents of latest active ticket:
    const ticket_contents = await pb.collection("tickets").getList(0, 100, {
        sort: "-created",
        expand: "ticket_contents(ticket).dish",
    });
    const ticket = ticket_contents.items
        .map(ticket => (ticket?.expand ?? {})["ticket_contents(ticket)"] ?? [])
        .map(content => content.map(item => item.expand.dish))
        .flat();

    $.show(() => html `
        <div>
            <h4>menu</h4>
                ${dishes.items.map(dish => html `
                    <div class="row">
                        <div class="col-md-4">${dish.name}</div>
                        <div class="col-md-4">$${dish.price}</div>
                        <div class="col-md-4">
                            <button class="btn btn-primary" onClick=${() => $.answer("add", dish)}>
                                add
                            </button>
                        </div>
                    </div>
                `)}
            <hr />
        </div>

        <div>
            <h4>your order ($${ticket.reduce((a, b) => a + b.price, 0)})</h4>
            <hr />
            ${ticket.map(dish => html `
                <div class="row">
                    <div class="col-md-4">${dish.name}</div>
                    <div class="col-md-4">$${dish.price}</div>
                    <div class="col-md-4">
                        <button class="btn btn-primary" onClick=${() => $.answer("edit", dish)}>
                            edit
                        </button>
                        <button class="btn btn-warning" onClick=${() => $.answer("delete", dish)}>
                            delete
                        </button>
                    </div>
                </div>
            `)}
            <hr />
            <div class="text-center">
                <button class="btn btn-primary" onClick=${() => $.answer("submit")}>Submit Order</button>
            </div>
            <div>
                <br /><br />
            </div>
        </div>
    `);
}


async function createUser($, name, email, password, password_confirm) {
    $.show("creating user");
    if (password !== password_confirm) {
        await $.capture(() => html `
            <div>passwords do not match</div>
            <button class="btn btn-primary" onClick=${$.answer}>ok</button>
        `);
        return false;
    }
    try {
        await pb.collection("users").create({
            name: name,
            email: email,
            password: password,
            passwordConfirm: password_confirm,
            isCook: false,
        });
        $.show("user created");
        await delay(1000);
        return true;
    } catch (e) {
        if (e.status === 400) {
            await $.capture(() => html `
                <div>there was an issue creating a new user with the details you provided.</div>
                <div>Please ensure that the password, username, and email are valid.</div>
                <button class="btn btn-primary" onClick=${$.answer}>ok</button>
            `);
            return false;
        } else {
            throw e;
        }
    }
}

async function attempt_signin($, username, password) {
    $.show("logging in");
    try {
        return await pb.collection("users").authWithPassword(username, password);
    } catch (e) {
        if (e.status === 400) {
            await $.capture(() => html `
                <div>invalid username or password</div>
                <button class="btn btn-primary" onClick=${$.answer}>ok</button>
            `);
            return null;
        } else {
            throw e;
        }
    }
}
async function refreshAuth() {
    try {
        return await pb.collection("users").authRefresh();
    } catch (e) {
        console.error(e);
        if (e.status === 401) {
            return null;
        } else {
            throw e;
        }
    }
}
