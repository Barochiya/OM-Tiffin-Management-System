const BusinessInfo = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8">

        <div className="text-center border-b pb-6">

          <h1 className="text-4xl font-bold text-blue-700">
            OM TIFFIN SERVICE
          </h1>

          <p className="text-gray-600 mt-3">
            Business Information
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">

          <div className="bg-gray-50 p-6 rounded-2xl">

            <h2 className="text-2xl font-bold mb-4">
              Business Details
            </h2>

            <p>
              <strong>Business Name:</strong>
              {" "}OM Tiffin Service
            </p>

            <p className="mt-3">
              <strong>Business Type:</strong>
              {" "}Tiffin & Meal Delivery Service
            </p>

            <p className="mt-3">
              <strong>Description:</strong>
              {" "}Fresh, hygienic and homemade food delivery service.
            </p>

          </div>

          <div className="bg-gray-50 p-6 rounded-2xl">

            <h2 className="text-2xl font-bold mb-4">
              Owner Information
            </h2>

            <p>
              <strong>Owner Name:</strong>
              {" "}BAROCHIYA DAXABEN SANJAYBHAI
            </p>

            <p className="mt-3">
              <strong>Designation:</strong>
              {" "}Founder
            </p>

          </div>

          <div className="bg-gray-50 p-6 rounded-2xl">

            <h2 className="text-2xl font-bold mb-4">
              Contact Information
            </h2>

            <p>
              <strong>Mobile:</strong>
              {" "}+91 9409380470
            </p>

            <p className="mt-3">
              <strong>Email:</strong>
              {" "}malaybarochiya@gmail.com
            </p>

            <p className="mt-3">
              <strong>Website:</strong>
              {" "}www.omtiffinservices.com
            </p>

          </div>

          <div className="bg-gray-50 p-6 rounded-2xl">

            <h2 className="text-2xl font-bold mb-4">
              Registration Details
            </h2>

            <p>
              <strong>MSME Number:</strong>
              {" "} UDYAM-GJ-09-0071480
            </p>

            

            <p className="mt-3">
              <strong>FSSAI License:</strong>
              {" "} 20723009000826
            </p>

          </div>

        </div>

        <div className="bg-gray-50 p-6 rounded-2xl mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Business Address
          </h2>

          <p>
            SECTOR-6 B, PLOT NO. 206/2, OPP. MAHADEV
TEMPLE, GANDHINAGAR,  GUJARAT, 382006
          </p>

        </div>

        <div className="bg-gray-50 p-6 rounded-2xl mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Services
          </h2>

          <ul className="list-disc ml-6 space-y-2">

            <li>Monthly Tiffin Service</li>

            <li>Lunch Delivery</li>

            <li>Dinner Delivery</li>

            <li>Online Bill Management</li>

            <li>WhatsApp Bill Delivery</li>

          </ul>

        </div>

        <div className="text-center text-gray-500 mt-10">

          © 2026 OM Tiffin Service. All Rights Reserved.

        </div>

      </div>

    </div>
  );
};

export default BusinessInfo;