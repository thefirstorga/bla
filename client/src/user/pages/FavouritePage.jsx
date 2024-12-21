import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PlaceImg from "../components/PlaceImg";

const FavouritePage = () => {
  const [places, setPlaces] = useState([]);
  
  useEffect(() => {
    const fetchFavouritePlaces = async () => {
      try {
        const response = await axios.get("/post/favourites"); // API lấy các nhà yêu thích của người dùng
        setPlaces(response.data);
      } catch (error) {
        console.error("Error fetching favourite places", error);
      }
    };

    fetchFavouritePlaces();
  }, [places]);

  return (
    <div className="mt-8 mb-4 lg:mx-16">
      <h2 className="text-2xl font-bold mb-4">Các nhà yêu thích của bạn</h2>
      {places.length === 0 ? (
        <p className="text-gray-500 text-xl">Bạn chưa lưu nhà nào</p>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {places.map(place => (
            <Link
              to={'/place/' + place.id}
              className='flex gap-4 bg-gray-200 rounded-2xl overflow-hidden shadow-md shadow-gray-500'
              key={place.id}
            >
              <div className='w-56'>
                <PlaceImg place={place}/>
              </div>
              <div className='py-3 pr-3 grow overflow-hidden w-80'>
                <h2 className='font-semibold text-xl text-gray-800 mt-1 truncate hover:truncate-none transition-all duration-300'>{place.title}</h2>
                <p className='text-md text-gray-500 mt-2 truncate hover:truncate-none transition-all duration-300'>{place.address}</p>
              </div>
            </Link>
        ))}
      </div>
      )}
    </div>
  );
};

export default FavouritePage;
