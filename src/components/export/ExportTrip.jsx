import React from 'react';
import { exportTripToPDF } from '../../Service/ExportService.jsx';
import toast from 'react-hot-toast';

const ExportTrip = ({ tripData }) => {
  const handleExport = () => {
    exportTripToPDF(tripData);
    toast.success('Trip exported to PDF');
  };

  return (
    <button
      onClick={handleExport}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      Export to PDF
    </button>
  );
};

export default ExportTrip;
