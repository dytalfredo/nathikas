import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVO_ORIGINAL = 'zoom_agencias_completo.json';
const ARCHIVO_DESTINO = 'zoom_venezuela_filtrado.json';

const filtrarAgenciasZoom = () => {
    console.log('--- Iniciando Procesamiento: Estructura de Array Plano ---');

    try {
        const rutaAbsoluta = path.join(__dirname, ARCHIVO_ORIGINAL);
        const rawData = fs.readFileSync(rutaAbsoluta, 'utf8');
        const contenido = JSON.parse(rawData);

        const listaCruda = contenido.entidadRespuesta;

        if (!Array.isArray(listaCruda)) {
            throw new Error('No se encontró la lista en "entidadRespuesta".');
        }

        const resultadoFinal = [];
        let contadorId = 1;

        listaCruda.forEach((ag) => {
            // Filtros: Venezuela, Activa y posee Servicio 13 (Casillero Nacional)
            const tieneCasillero = ag.servicios?.some(s => s.codservicio === 13);

            if (ag.pais_nombre === "VENEZUELA" && ag.inactivo === false && tieneCasillero) {

                // Construimos el objeto con la estructura exacta solicitada
                resultadoFinal.push({
                    "agencia_id": contadorId,
                    "estado_id": ag.codestado,
                    "nombre": ag.nombre?.trim(),
                    "codigo": ag.codoficina?.toString(), // Mapeamos codoficina a la llave 'codigo'
                    "direccion": ag.direccion?.trim(),
                    "latitud": ag.latitud,
                    "longitud": ag.longitud,
                    "estado": ag.nombre_estado?.trim()
                });

                contadorId++;
            }
        });

        // Guardar el archivo final
        fs.writeFileSync(
            path.join(__dirname, ARCHIVO_DESTINO),
            JSON.stringify(resultadoFinal, null, 2),
            'utf8'
        );

        console.log('--- Proceso Completado ---');
        console.log(`Total agencias exportadas: ${resultadoFinal.length}`);
        console.log(`Archivo generado: ${ARCHIVO_DESTINO}`);

    } catch (error) {
        console.error('Error procesando el JSON:', error.message);
    }
};

filtrarAgenciasZoom();