import { Producto } from './entities/Producto.js';
import { ElementoCarrito } from './entities/ElementoCarrito.js';

/**
 * Definiciones de constantes
 */
const estandarDolaresAmericanos = Intl.NumberFormat('en-US');
let numeroOrden = 1; // Inicializar el número de orden

/**
 * Vamos a crear listas de apoyo
 */
let productos = [];
let elementosCarrito = [];

/**
 * Referencias a elementos en DOM
 */
const contenedorProductos = document.getElementById('contenedor-productos');
const botonFinalizarCompra = document.getElementById('boton-finalizar-compra');
const modalCarrito = new bootstrap.Modal(document.getElementById('carritoCompras')); // Referencia al modal de carrito

/**
 * Arrow function para cargar productos
 */
const cargarProductos = () => {
    fetch('./js/data/productos.json')
        .then(respuesta => respuesta.json())
        .then(productosJS => {
            productosJS.forEach(elementoJson => {
                productos.push(new Producto(
                    elementoJson.id,
                    elementoJson.nombre,
                    elementoJson.precio,
                    elementoJson.urlFoto,
                    elementoJson.descripcion
                ));
            });
            dibujarCatalogoProductos();
        })
        .catch(error => {
            console.error("Hubo un error al cargar la información", error);
            Swal.fire({
                title: 'Imposible realizar la carga',
                text: `Éste es el error recibido: ${error}`,
                icon: 'error'
            });
        });
};

/**
 * Evento para agregar productos al carrito
 * y abrir el modal del carrito directamente
 */
const agregarProductoYMostrarCarrito = producto => {
    let elementoExistente = elementosCarrito.find(el => el.producto.id === producto.id);

    if (elementoExistente) {
        elementoExistente.cantidad += 1; // Si ya existe en el carrito, aumentar la cantidad
    } else {
        let elemento = new ElementoCarrito(producto, 1); // Agregar el producto con cantidad inicial 1
        elementosCarrito.push(elemento);
    }

    dibujarCarritoCompras();
    modalCarrito.show(); // Mostrar el modal del carrito
};

/**
 * Función para crear la carta de producto
 */
const crearCardProducto = (producto) => {
    let botonAgregar = document.createElement('button');
    botonAgregar.classList.add('btn', 'btn-success');
    botonAgregar.innerText = "Comprar";
    botonAgregar.onclick = () => agregarProductoYMostrarCarrito(producto); // Al hacer clic, agregar al carrito y abrir el modal

    let pieCarta = document.createElement('div');
    pieCarta.className = 'card-footer text-end';
    pieCarta.appendChild(botonAgregar);

    let carta = document.createElement('div');
    carta.className = 'card h-100';

    let imagenProducto = document.createElement('img');
    imagenProducto.src = producto.urlFoto;
    imagenProducto.className = 'card-img-top';
    imagenProducto.alt = producto.nombre;

    let cuerpoCarta = document.createElement('div');
    cuerpoCarta.className = 'card-body';
    cuerpoCarta.innerHTML = `
        <h5 class="card-title">${producto.nombre}</h5>
        <h6 class="card-subtitle mb-2 text-body-secondary">$ ${producto.precio} MXN</h6>
        <p class="card-text">${producto.descripcion}</p>
    `;

    carta.appendChild(imagenProducto);
    carta.appendChild(cuerpoCarta);
    carta.appendChild(pieCarta);

    let celda = document.createElement('div');
    celda.className = 'col';
    celda.appendChild(carta);

    return celda;
};

/**
 * Función para dibujar el carrito de compras
 */
const dibujarCarritoCompras = () => {
    const bodyCarrito = document.getElementById('bodyCarrito');
    bodyCarrito.innerHTML = '';

    let sumaCarrito = 0;

    elementosCarrito.forEach((elemento, i) => {
        let renglon = document.createElement('tr');
        renglon.innerHTML = `
            <th scope="row">${elemento.producto.id}</th>
            <td>${elemento.producto.nombre}</td>
            <td><input id="cantidad-producto-${i}" type="number" 
                    value="${elemento.cantidad}" 
                    min="1" max="100" step="1" 
                    class="caja-cantidad-producto"></td>
            <td>$ ${estandarDolaresAmericanos.format(elemento.producto.precio)}</td>
            <td id="total-producto-${i}">$ ${estandarDolaresAmericanos.format(elemento.producto.precio * elemento.cantidad)}</td>
            <td><button class="btn btn-danger btn-eliminar" data-index="${i}">Eliminar</button></td>
        `;

        bodyCarrito.appendChild(renglon);

        // Manejar cambio en cantidad
        let inputCantidadProducto = document.getElementById(`cantidad-producto-${i}`);
        inputCantidadProducto.onchange = (ev) => {
            let nuevaCantidad = parseInt(ev.target.value, 10);
            elemento.cantidad = nuevaCantidad;
            // Actualizar el total individual
            document.getElementById(`total-producto-${i}`).innerText = `$ ${estandarDolaresAmericanos.format(elemento.producto.precio * nuevaCantidad)}`;
            // Actualizar el total general
            actualizarTotalCarrito();
        };

        // Sumar el total del carrito
        sumaCarrito += elemento.producto.precio * elemento.cantidad;
    });

    const footerCarrito = document.getElementById('footerCarrito');

    if (elementosCarrito.length === 0) {
        footerCarrito.innerHTML = '<span>No hay productos en el carrito :(</span>';
    } else {
        footerCarrito.innerHTML = `Total de la compra: $ ${estandarDolaresAmericanos.format(sumaCarrito)}`;
    }

    // Manejar la eliminación de productos del carrito
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            elementosCarrito.splice(index, 1); // Eliminar el producto del carrito
            dibujarCarritoCompras(); // Redibujar el carrito después de eliminar
        });
    });
};

/**
 * Función para actualizar solo el total del carrito
 */
const actualizarTotalCarrito = () => {
    let sumaCarrito = elementosCarrito.reduce((suma, elemento) => suma + elemento.producto.precio * elemento.cantidad, 0);
    const footerCarrito = document.getElementById('footerCarrito');
    footerCarrito.innerHTML = `Total de la compra: $ ${estandarDolaresAmericanos.format(sumaCarrito)}`;
};

/**
 * Función para finalizar la compra
 */
const finalizarCompra = () => {
    if (elementosCarrito.length === 0) {
        Swal.fire({
            title: 'Carrito vacío',
            text: 'No tienes productos en el carrito.',
            icon: 'warning'
        });
    } else {
        // Mostrar el número de orden y mensaje de agradecimiento
        Swal.fire({
            title: '¡Gracias por tu compra!',
            text: `Tu número de orden es: ${numeroOrden}`,
            icon: 'success'
        });

        // Incrementar el número de orden para la próxima compra
        numeroOrden++;

        // Vaciar el carrito
        elementosCarrito = [];
        dibujarCarritoCompras();
    }
};

/**
 * Asignar el evento al botón de finalizar compra
 */
botonFinalizarCompra.addEventListener('click', finalizarCompra);

/**
 * Función para dibujar el catálogo de productos
 */
const dibujarCatalogoProductos = () => {
    let contenedorProductos = document.getElementById('contenedor-productos');
    contenedorProductos.innerHTML = '';

    productos.forEach(productoActual => {
        contenedorProductos.appendChild(crearCardProducto(productoActual));
    });
};

/**
 * Función para inicializar la carga de productos
 */
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
});
