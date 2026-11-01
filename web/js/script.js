
let cart = [];

document.addEventListener("DOMContentLoaded", function () {
    loadFoodItems();
});

// =====================================
// 1. LOAD FOOD ITEMS FROM MYSQL
// =====================================

async function loadFoodItems() {
    const container = document.querySelector(".food-container");
    if (!container) return;

    container.innerHTML = "<p>Loading food items...</p>";

    try {
        const response = await fetch("/CampusCart/foods");

        if (!response.ok) {
            throw new Error("Unable to load food items");
        }

        const foods = await response.json();
        container.innerHTML = "";

        foods.forEach(function (food) {
            const card = document.createElement("div");
            card.className = "food-card";

            const heading = document.createElement("h3");
            heading.textContent = food.name;

            const description = document.createElement("p");
            description.textContent = food.description;

            const price = document.createElement("h4");
            price.textContent = "₹" + food.price;

            const button = document.createElement("button");
            button.textContent = "+ Add";

            button.onclick = function () {
                addToCart(food.name, Number(food.price));
            };

            card.append(heading, description, price, button);
            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = "<p>Unable to load food menu.</p>";
        console.error(error);
    }
}

// =====================================
// 2. ADD FOOD TO CART
// =====================================

function addToCart(name, price) {
    const item = cart.find(food => food.name === name);

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();
}

// =====================================
// 3. UPDATE CART AND TOTAL
// =====================================

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cartCount = document.getElementById("cart-count");

    let total = 0;
    let count = 0;

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.textContent = "Your cart is empty.";
    }

    cart.forEach(function (item) {
        total += item.price * item.quantity;
        count += item.quantity;

        const row = document.createElement("p");

        row.textContent =
            item.name + " x " + item.quantity +
            " = ₹" + (item.price * item.quantity);

        cartItems.appendChild(row);
    });

    cartTotal.textContent = "Total: ₹" + total.toFixed(2);

    if (cartCount) {
        cartCount.textContent = count;
    }
}

// =====================================
// 4. PLACE ORDER IN MYSQL
// =====================================

async function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const location = prompt("Enter your hostel or delivery location:");

    if (!location || !location.trim()) {
        alert("Please enter your delivery location.");
        return;
    }

    const data = new URLSearchParams();

    data.append("location", location.trim());

    data.append(
        "items",
        cart.map(item => item.name + ":" + item.quantity).join(",")
    );

    try {
        const response = await fetch("/CampusCart/place-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: data.toString()
        });

        const result = await response.text();
        alert(result);

        if (response.ok &&
    result.includes("Order placed successfully")) {

    currentOrders++;
    checkRobot();
    cart = [];
    updateCart();
}
    } catch (error) {
        alert("Unable to place order. Please try again.");
        console.error(error);
    }
}

// =====================================
// 5. SEARCH FOOD
// =====================================

function searchFood() {
    const search = document.getElementById("food-search")
        .value.toLowerCase();

    const cards = document.querySelectorAll(".food-container .food-card");

    cards.forEach(function (card) {
        card.style.display =
            card.textContent.toLowerCase().includes(search) ? "" : "none";
    });
}

// =====================================
// 6. CAMPUS MAP REPRESENTATION
// =====================================

const campusGraph = {
    Cafe: { Corner: 3, Healthy: 5 },
    Corner: { Cafe: 3, HostelA: 4, Library: 3 },
    Healthy: { Cafe: 5, HostelB: 4, Library: 2 },
    HostelA: { Corner: 4, HostelB: 3 },
    HostelB: { HostelA: 3, Healthy: 4 },
    Library: { Corner: 3, Healthy: 2 }
};

// =====================================
// 7. BREADTH FIRST SEARCH (BFS)
// =====================================

function bfs(start, end) {
    let queue = [[start]];
    let visited = new Set([start]);

    while (queue.length > 0) {
        let path = queue.shift();
        let node = path[path.length - 1];

        if (node === end) return path;

        for (let next in campusGraph[node]) {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push([...path, next]);
            }
        }
    }

    return null;
}

// =====================================
// 8. DEPTH FIRST SEARCH (DFS)
// =====================================

function dfs(start, end) {
    let stack = [[start]];
    let visited = new Set();

    while (stack.length > 0) {
        let path = stack.pop();
        let node = path[path.length - 1];

        if (node === end) return path;
        if (visited.has(node)) continue;

        visited.add(node);

        for (let next in campusGraph[node]) {
            if (!visited.has(next)) {
                stack.push([...path, next]);
            }
        }
    }

    return null;
}

// =====================================
// 9. A STAR LEAST-COST ROUTE
// =====================================

function heuristic(a, b) {
    // Zero heuristic guarantees an admissible estimate.
    return 0;
}

function astar(start, end) {
    let open = [start];
    let cameFrom = {};

    let g = { [start]: 0 };
    let f = { [start]: heuristic(start, end) };

    while (open.length > 0) {
        open.sort((a, b) => f[a] - f[b]);

        let current = open.shift();

        if (current === end) {
            let path = [current];

            while (cameFrom[current]) {
                current = cameFrom[current];
                path.unshift(current);
            }

            return {
                path: path,
                cost: g[end]
            };
        }

        for (let next in campusGraph[current]) {
            let newCost =
                g[current] + campusGraph[current][next];

            if (newCost < (g[next] ?? Infinity)) {
                cameFrom[next] = current;
                g[next] = newCost;

                f[next] = newCost + heuristic(next, end);

                if (!open.includes(next)) {
                    open.push(next);
                }
            }
        }
    }

    return null;
}

// =====================================
// 10. RUN ROUTE ALGORITHMS
// =====================================

function runAI(type) {
    const start = document.getElementById("route-start").value;
    const end = document.getElementById("route-end").value;

    const output = document.getElementById("route-result");

    if (start === end) {
        output.textContent = "Start and destination are the same.";
        return;
    }

    let path;
    let message;

    if (type === "bfs") {
        path = bfs(start, end);
        message = "BFS Route";
    }

    else if (type === "dfs") {
        path = dfs(start, end);
        message = "DFS Route";
    }

    else if (type === "astar") {
        const result = astar(start, end);

        if (result) {
            path = result.path;
            message = "A* Least-Cost Route | Cost: " + result.cost;
        }
    }

    output.textContent = path
        ? message + ": " + path.join(" → ")
        : "No route found.";
}

// =====================================
// 11. PRIORITY-BASED SCHEDULING
// =====================================

function scheduleOrders() {
    const orders = [
        { id: 101, priority: "Normal", rank: 3 },
        { id: 102, priority: "Urgent", rank: 1 },
        { id: 103, priority: "High", rank: 2 },
        { id: 104, priority: "Normal", rank: 3 }
    ];

    orders.sort((a, b) => a.rank - b.rank);

    const output = document.getElementById("schedule-result");

    output.textContent = orders.map(function (order) {
        return "Order " + order.id +
            " (" + order.priority + ")";
    }).join(" → ");
}


// =====================================
// 12. BATTERY AND CAPACITY MONITORING
// =====================================

let robotBattery = 100;
let robotCapacity = 5;
let currentOrders = 0;

function checkRobot() {
    let result = document.getElementById("robot-result");

    result.innerHTML =
        "Battery: " + robotBattery + "%<br>" +
        "Orders carried: " + currentOrders + "/" + robotCapacity;

    if (robotBattery < 20) {
        result.innerHTML += "<br>Warning: Robot needs charging!";
    } else {
        result.innerHTML += "<br>Robot is ready.";
    }
}

function completeDelivery() {
    if (currentOrders === 0) {
        alert("No orders to deliver!");
        return;
    }

    robotBattery -= 10;
    currentOrders--;

    if (robotBattery < 0) {
        robotBattery = 0;
    }

    checkRobot();
}

// =====================================
// 13. LOGIN
// =====================================

function showLogin() {
    alert("Login feature coming soon!");
}
