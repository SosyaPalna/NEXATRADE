const axios = require('axios');

const DADATA_API_KEY = process.env.DADATA_API_KEY;
const DADATA_BASE_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';

async function findPartyByInn(inn) {
  if (!DADATA_API_KEY) {
    throw new Error('DADATA_API_KEY not set in .env');
  }

  try {
    const { data } = await axios.post(
      `${DADATA_BASE_URL}/findById/party`,
      { query: inn },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${DADATA_API_KEY}`,
        },
        timeout: 10000,
      }
    );

    const suggestion = data.suggestions?.[0];
    if (!suggestion) return null;

    const party = suggestion.data;
    return {
      inn: party.inn,
      ogrn: party.ogrn,
      kpp: party.kpp,
      name: party.name?.short_with_opf || party.name?.short || suggestion.value,
      fullName: party.name?.full_with_opf || suggestion.value,
      type: party.type, // LEGAL (ООО/АО) или INDIVIDUAL (ИП)
      status: party.state?.status, // ACTIVE, LIQUIDATING, LIQUIDATED
      address: party.address?.value,
      director: party.management?.name,
      directorPost: party.management?.post,
      okved: party.okved,
      okpo: party.okpo,
      oktmo: party.oktmo,
      okato: party.okato,
      registrationDate: party.state?.registration_date,
      liquidationDate: party.state?.liquidation_date,
    };
  } catch (err) {
    console.error('[DaData] Error:', err.response?.data || err.message);
    throw new Error('Failed to fetch company data from DaData');
  }
}

module.exports = { findPartyByInn };
