import jsPDF from 'jspdf';

export const exportTripToPDF = (tripData) => {
  const doc = new jsPDF();
  doc.text('Trip Details', 10, 10);
  doc.text(`Destination: ${tripData.destination}`, 10, 20);
  doc.text(`Duration: ${tripData.duration} days`, 10, 30);
  doc.text(`Budget: ${tripData.budget}`, 10, 40);
  doc.save('trip-details.pdf');
};
