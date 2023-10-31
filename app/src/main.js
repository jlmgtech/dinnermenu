import { render } from "preact";
import PocketBase from 'pocketbase';
import Slot, {Stamp} from "slot";
import html from "html";
import { delay, Store } from "slot/utils";
const pb = new PocketBase('http://127.0.0.1:8090');
window.pb = pb;
pb.collection('posts').subscribe('*', (...args) => { console.log('posts', args); });

render(html`<${Slot} flow=${main} />`, document.getElementById("app"));

async function mainLayout(layout, user) {
    const content = new Stamp();
    layout.show(() => html `
        <div class="menu-bar">
            <div class="container">
                <div class="row">
                    <div class="col-md-12">
                        <div style="text-align:right">
                            <span class="user-name">${user.record.name}</span>
                            <img class="avatar" src=${getAvatar(user)} onClick=${() => layout.answer("logout")} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12">
                    <div>${content.stamp()}</div>
                </div>
            </div>
        </div>
    `);

    layout.expect("logout").then(() => {
        const proceed = confirm("Are you sure you want to logout?");
        if (proceed) {
            pb.authStore.clear();
            layout.show("logging out...");
            delay(1000).then(() => {
                location.reload();
            });
        }
    });

    return await content.slot();
}

function getAvatar(user) {
    const token = user.record.id;
    return `http://127.0.0.1:8090/api/files/_pb_users_auth_/${token}/${user.record.avatar}`;
}

function getItemImage(food) {
    const collection_id_or_name = food.collectionId;
    const record_id = food.id;
    return `http://127.0.0.1:8090/api/files/${collection_id_or_name}/${record_id}/${food.images[0]}`;
}

async function cook(slot, user) {
    slot.show(() => html `
        <div> Waiting for orders to be placed... </div>
    `);
    await slot.capture();
}

async function get_user_info(slot) {
    // first, try to get it from localStorage
    //const user = pb.authStore;
    //console.log("authstore: ", user);
    //if (user) return user;
    return await login(slot);
}

async function main(layout) {

    const user = await get_user_info(layout);
    if (!user) return;

    const slot = await mainLayout(layout, user);

    if (user.record.isCook) {

        await cook(slot, user);

    } else {

        const order = await menu(slot);

        slot.show(() => html `
            <div>
                <div>Your order is being processed.</div>
                <div>
                    Your '${order.name}' will be ready in about
                    ${" "} ${order.time} minutes.
                </div>
            </div>
        `);

        await slot.capture();

    }
}

async function menu(slot) {
    const {items} = await pb.collection("item").getList(1, 10);
    console.log("items: ", items[0]);
    slot.show(() => html `
        <div>
            <br />
            <div class="text-center">Choose an entree for dinner:</div>
            <br />
            <div class="menu-container">
                ${items.map(food => html`
                    <div key=${food.id} class="menu-item">
                        <div>${food.name} $${food.price}</div>
                        <hr />
                        <div><img class="menu-img" src=${getItemImage(food)} /></div>
                        <div>${food.time} minutes</div>
                        <div class="menu-item-ingredients">ingredients: ${food.ingredients}</div>
                        <br />
                        <button class="btn btn-primary" onClick=${() => slot.answer("order", food)}>order $${food.price}</button>
                    </div>
                `)}
            </div>
        </div>
    `);
    const [_, item] = await slot.expect("order");
    return item;
}

async function login(slot) {
    // render the login menu
    const username = new Store("jim");
    const password = new Store("asdfasdf");
    slot.show(() => html `
        <!-- center this horizontally -->

        <div class="container">
            <div>
                <br /><br />
            </div>
            <div class="row">
                <div class="col-md-12 text-center">
                    <h1>login</h1>
                </div>
            </div>
            <div><br /></div>
            <div class="row">
                <div class="col-md-12">
                    <input class="form-control" type="text" placeholder="username" value=${username} onInput=${username.bind} /><br />
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <input class="form-control" type="password" placeholder="password" value=${password} onInput=${password.bind} /><br />
                </div>
            </div>
            <div class="row">
                <div class="col-md-12 text-center">
                    <button class="btn btn-primary" onClick=${() => slot.answer()} >login</button>
                </div>
            </div>
        </div>
    `);

    await slot.capture();
    slot.show(() => html `<div style='text-align:center'>loading</div>`);
    try {
        const user = await pb.collection('users').authWithPassword(username.get(), password.get());
        slot.show(() => html `<div style='text-align:center'>login success</div>`);
        await delay(250);
        if (user) {
            console.log("saving user: ", user);
            pb.authStore.save(user.token, user.record);
        }
        return user;
    } catch (e) {
        slot.show("login failed");
        await delay(1000);
        return null;
    }
}
