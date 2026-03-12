// OpenWeather API - Api de terceros para el clima
const API_KEY = '5041d54fd8a673370a396b5ccf24748a';

const getWeather = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

  try {
    const response = await fetch(url);

    if (!response.ok)
      throw new Error('La petición a la API no funcionó');

    const data = await response.json();
    console.log('Datos del clima obtenidos', data);

    // Ajuste: data.sys.country nos da el país (ej: CL, AR, ES)
    const ciudad = data.name;
    const pais = data.sys.country;

    const topBar = document.getElementById('topBar');
    
    if (topBar) {
      topBar.innerHTML = `
        <div class="container-fluid bg-success text-white py-1">
          <p class="small my-0 mx-auto d-flex align-items-center justify-content-center">
            <strong>Clima en ${ciudad}, ${pais}:</strong> 
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" width="35" class="mx-1"> 
            ${data.weather[0].description.toUpperCase()} | 
            🌡️ ${Math.round(data.main.temp)}°C | 
            💧 Humedad: ${data.main.humidity}%
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error al obtener el clima:", error);
    // Opcional: Mostrar un mensaje de error amigable en la barra
    const topBar = document.getElementById('topBar');
    if (topBar) topBar.innerHTML = `<p class="small my-1 text-danger text-center">No se pudo cargar el clima local.</p>`;
  }
};

export default getWeather;