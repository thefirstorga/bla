import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BookingWidget from '../components/BookingWidget';
import PlaceGallery from '../components/PlaceGallery';
import { UserContext } from '../components/UserContext';
import PlaceDetail from './PlaceDetail';
import { addMonths, differenceInCalendarMonths, differenceInDays, format } from 'date-fns';
import InvoiceDetailRenter from '../components/InvoiceDetailRenter';
import MapComponent from '../components/MapComponent';
import { BASE_URL } from '../../config';
import CommentsSection from '../components/CommentsSection';
import UserRentHistory from '../components/UserRentHistory';
import PlaceFav from '../components/PlaceFav';

function PlacePage() {
    const { id } = useParams();
    const { user } = useContext(UserContext);
    const [place, setPlace] = useState(null);
    // bookingDetail là biến mà lưu state booking của người đang đăng nhập
    const [bookingDetail, setBookingDetail] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [showReportsPopup, setShowReportsPopup] = useState(false);

    // useEffect for fetching place data
    useEffect(() => {
        if (!id) return;
        axios.get(`/post/place/${id}`)
            .then(response => {
                setPlace(response.data.place);
            })
            .catch(error => {
                console.error("There was an error fetching the place data!", error);
            });
    }, [id])
    
    // useEffect for checking booking details only after place data is loaded
    useEffect(() => {
        if (user && user.id && place?.bookings) {
            const userBooking = place.bookings.find(booking => booking.renterId === user.id && (booking.status !== 'RENTED' && booking.status !== 'REJECTED'));
            setBookingDetail(userBooking);
        }
    }, [place?.bookings, user]);

    async function continueRent(ev, bookingId, placeId) {
        ev.preventDefault();
        const data = { bookingId, placeId };
        await axios.put('/booking/continue-rent', data)
        window.location.reload()
    }

    async function notContinueRent(ev, bookingId) {
        ev.preventDefault();
        const data = {bookingId}
        await axios.put('/booking/not-continue-rent', data)
        window.location.reload()
    }

    async function notRentRequest(ev, bookingId) {
        ev.preventDefault();
        const data = {bookingId}
        await axios.put('/booking/not-rent-request', data)
        window.location.reload()
    }

    async function undoNotRentRequest(ev, bookingId) {
        ev.preventDefault();
        const data = {bookingId}
        await axios.put('/booking/undo-not-rent-request', data)
        window.location.reload()
    }
    // console.log(bookingDetail)

    let rentInfo = null
    let bookingWidget = (
        <div>
            <BookingWidget place={place} />
        </div>
    )
    let option = null
    let bookingRented = []
    let reported = null
    let reportInfo = null

    if (!place && !bookingDetail) {
        return <div>Loading place data...</div>
    } else {
        let bookingNow = place.bookings.find(booking => booking.status === "APPROVED") || place.bookings.find(booking => booking.status === "WAIT")// dòng này tìm xem có cái nào approved không
        bookingRented = place.bookings.filter((booking) => booking.status === "RENTED" && booking.renterId === user.id)
        reported = place?.reports.find(report => report.reporterId === user.id)

        if (place?.reports?.length > 0) {
            const pendingReports = place.reports.filter((report) => report.status === 'PENDING');
            const doneReports = place.reports.filter((report) => report.status === 'DONE');

            if (doneReports.length > 0) {
                if(bookingNow) {
                    bookingWidget = null
                    reportInfo = (
                        <div>
                            <h2 className="font-semibold text-2xl text-red-600">
                                Nhà này đã bị admin đưa vào danh sách đen.
                            </h2>
                            <h2 className="font-semibold text-lg">
                                Bạn đang thuê nhà này, vì vậy hãy nhanh chóng hoàn thành thủ tục hủy thuê phòng.
                            </h2>
                        </div>
                    );
                } else {
                    bookingWidget = null
                    reportInfo = (
                        <div>
                            <h2 className="font-semibold text-2xl text-red-600">
                                Nhà này đã bị admin đưa vào danh sách đen và không thể booking.
                            </h2>
                        </div>
                    );
                }
                
            } 
            else if (pendingReports.length > 0) {
                reportInfo = (
                    <div>
                        <h2 className="font-semibold text-2xl text-primary mb-1">Lưu ý</h2>
                        <button
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            onClick={() => setShowReportsPopup(true)} // Mở popup
                        >
                            {`Nhà này có ${pendingReports.length} báo cáo đang chờ xử lý`}
                        </button>

                        {/* Popup hiển thị chi tiết các report */}
                        {showReportsPopup && (
                            <div
                                id="popup-overlay"
                                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                onClick={(e) => {
                                    if (e.target.id === 'popup-overlay') setShowReportsPopup(false); // Đóng popup khi bấm ra ngoài
                                }}
                            >
                                <div className="bg-white p-6 rounded shadow-md w-96 max-h-[90%] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4">Danh sách báo cáo</h2>
                                    <ul className="space-y-4">
                                        {pendingReports.map((report) => (
                                            <li key={report.id} className="border-b pb-4">
                                                <p><strong>Lý do:</strong> {report.reason}</p>
                                                <p><strong>Người báo cáo:</strong> {report.reporter.name} ({report.reporter.email})</p>
                                                <p><strong>Số điện thoại:</strong> {report.reporter.phone}</p>
                                                <p><strong>Trạng thái:</strong> {report.status}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                        onClick={() => setShowReportsPopup(false)} // Đóng popup
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
        }

        if(user.id === place.ownerId) {
            return <PlaceDetail/>
        }
        // let bookingNow = place.bookings.find(booking => booking.status === "APPROVED") || place.bookings.find(booking => booking.status === "WAIT")// dòng này tìm xem có cái nào approved không
        // console.log(bookingNow)
        if(place.bookings.length !== 0 && 
            bookingNow !== undefined 
        ) {
            const today = new Date();
            const checkOutDate = new Date(bookingNow.checkOut);
            const monthsRemaining = differenceInCalendarMonths(checkOutDate, today);

            if(monthsRemaining > 0) {
                bookingWidget = null
                rentInfo = (
                    <div className='bg-gray-200 p-6 mb-6 rounded-2xl'>
                        <h2 className='text-xl font-bold text-primary'>
                            Nhà này đang có người thuê!
                        </h2>
                    </div>
                )
            } else {
                rentInfo = (
                    <div className='bg-gray-200 p-6 mb-6 rounded-2xl'>
                        <h2 className='text-xl font-bold text-primary'>
                            Nhà này đang có người thuê!
                        </h2>
                        <h2 className='font-bold'> - Tuy nhiên họ chưa xác nhận ở tiếp trong vòng 1 tháng nữa, bạn vẫn có thể đặt thuê nhà này!</h2>
                        <h2 className='font-bold'> - Bạn có thể kéo xuống và đặt trước nhà này.</h2>
                    </div>
                )
            }
        }
        if(bookingDetail != null) {
            if(bookingDetail.status === 'PENDING') {
                rentInfo = (
                    <div className='bg-gray-200 p-6 mb-6 rounded-2xl'>
                        <h2 className='text-xl font-bold text-primary'>Your booking information:</h2>
                        <div>
                            Bạn đã đặt phòng, vui lòng chờ chủ nhà duyệt nhé! <br />
                            Bạn vẫn có thể hủy booking!
                        </div>
                    </div>
                )
            }
            if(bookingDetail.status === 'APPROVED') {
                const today = new Date();
                const checkOutDate = new Date(bookingNow.checkOut);
                let monthsRemaining = differenceInCalendarMonths(checkOutDate, today);
                // const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + monthsRemaining, 1);
                // const remainingDaysInMonth = differenceInDays(checkOutDate, startOfNextMonth);
                let adjustedStartDate = addMonths(today, monthsRemaining);
                let remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;
        
                if (remainingDaysInMonth < 0) {
                    monthsRemaining -= 1;
                    adjustedStartDate = addMonths(today, monthsRemaining);
                    remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;
                }

                if(monthsRemaining === 0 
                    && bookingDetail.isContinue === false
                ) {
                    option = (
                        <div>
                            <p className="text-lg font-semibold text-gray-800">Bạn có thể chọn ở tiếp nhà này.</p>
                            <button onClick={(ev) => continueRent(ev, bookingDetail.id, id)} className="primary">Tiếp tục ở</button>
                            <button onClick={(ev) => notContinueRent(ev, bookingDetail.id)} className="mt-2 primary">Không tiếp tục ở</button>
                        </div>
                    )
                    console.log("option")
                } else if(bookingDetail.isContinue === true) {
                    option = (
                        <div>
                            <p className="text-lg font-semibold text-gray-800">
                                Bạn đã xác nhận không ở tiếp nữa. <br />
                                Bạn có thể hủy thuê nhà ở đây.
                            </p>
                        </div>
                    )
                }

                rentInfo = (
                    <div>
                        <div className='bg-gray-200 p-6 mb-6 rounded-2xl'>
                            <div className='space-y-3'>
                                <h2 className='text-xl font-bold text-primary'>Bạn đang thuê nhà này!</h2>
                                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                                    <p className="text-lg font-semibold text-gray-800">Thời hạn hợp đồng:</p>
                                    <p className="text-gray-600">{format(checkOutDate, 'dd-MM-yyyy')}</p>
                                </div>
                                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                                    <p className="text-lg font-semibold text-gray-800">Thời gian còn lại:</p>
                                    <p className="text-gray-600">
                                        {monthsRemaining > 0 && `${monthsRemaining} tháng `}
                                        {remainingDaysInMonth > 0 && `${remainingDaysInMonth} ngày`}
                                        {monthsRemaining === 0 && remainingDaysInMonth === 0 && 'Hết hạn hôm nay'}
                                    </p>
                                </div>
                                {option}
                                <button onClick={(ev) => notRentRequest(ev, bookingDetail.id)} className="primary">Hủy thuê nhà</button>
                            </div>
                            <InvoiceDetailRenter bookingId={bookingDetail.id} />
                        </div>
                    </div>
                )
                bookingWidget = null
            }
            if(bookingDetail.status === 'WAIT') {
                const today = new Date();
                const checkOutDate = new Date(bookingNow.checkOut);
                let monthsRemaining = differenceInCalendarMonths(checkOutDate, today);
                // const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + monthsRemaining, 1);
                // const remainingDaysInMonth = differenceInDays(checkOutDate, startOfNextMonth);
                let adjustedStartDate = addMonths(today, monthsRemaining);
                let remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;
        
                if (remainingDaysInMonth < 0) {
                    monthsRemaining -= 1;
                    adjustedStartDate = addMonths(today, monthsRemaining);
                    remainingDaysInMonth = differenceInDays(checkOutDate, adjustedStartDate) + 1;
                }

                rentInfo = (
                    <div>
                        <div className='bg-gray-200 p-6 mb-6 rounded-2xl'>
                            <div className='space-y-3'>
                                <h2 className='text-xl font-bold text-primary'>Bạn đang thuê nhà này!</h2>
                                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                                    <p className="text-lg font-semibold text-gray-800">Thời hạn hợp đồng:</p>
                                    <p className="text-gray-600">{format(checkOutDate, 'dd-MM-yyyy')}</p>
                                </div>
                                <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                                    <p className="text-lg font-semibold text-gray-800">Thời gian còn lại:</p>
                                    <p className="text-gray-600">
                                        {monthsRemaining > 0 && `${monthsRemaining} tháng `}
                                        {remainingDaysInMonth > 0 && `${remainingDaysInMonth} ngày`}
                                        {monthsRemaining === 0 && remainingDaysInMonth === 0 && 'Hết hạn hôm nay'}
                                    </p>
                                </div>
                                <h2 className='text-xl font-bold text-primary'>Bạn đã hủy thuê nhà!</h2>
                                <button onClick={(ev) => undoNotRentRequest(ev, bookingDetail.id)} className="primary">Hoàn tác hủy thuê nhà</button>
                            </div>
                            <InvoiceDetailRenter bookingId={bookingDetail.id} />
                        </div>
                    </div>
                )
                bookingWidget = null
            }
        }
    }

    const handleReportClick = () => {
        setIsPopupOpen(true);
    };

    const handleOutsideClick = (e) => {
        if (e.target.id === 'popup-overlay') {
            setIsPopupOpen(false);
        }
        
    };

    const handleSendReport = async () => {
        if (!reason) {
            alert('Vui lòng nhập lý do.');
            return;
        }
        try {
            // Gửi request xóa tài khoản
            const response = await axios.post(
              '/post/add-report',
              {
                reason: reason,
                placeId: id
              }
            );
      
            // Hiển thị thông báo thành công và chuyển hướng
            alert(response.data.message)
            
            window.location.reload()
          } catch (error) {
            // Xử lý lỗi
            alert(error.response?.data?.message || 'Có lỗi xảy ra!');
          }
    };

    return (
        <div>
            {/* Content Based on Booking Status */}
            {rentInfo && (<div className='mt-2 bg-gray-100 px-8 py-8 rounded-lg shadow-md'>
                {rentInfo}
            </div>)}
            {reportInfo && (<div className='mt-2 bg-gray-100 px-8 py-8 rounded-lg shadow-md'>
                {reportInfo}
            </div>)}
            {/* Place Details Section */}
            <div className="mt-4 bg-gray-100 px-8 py-8 rounded-lg shadow-md">
                <div className='flex gap-4 items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <h1 className="text-3xl font-semibold text-gray-800">{place.title}</h1>
                        <PlaceFav place={place}/>
                    </div>
                    <button className='flex gap-2 items-center bg-white' onClick={handleReportClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                        </svg>
                        <p className='font-semibold text-lg'>Báo cáo</p>
                    </button>
                </div>
                <div className='flex gap-6 my-2'>
                    <p className='flex gap-1 my-2 font-semibold'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {place.address}
                    </p>
                    {place.latitude && (
                        <MapComponent places={[place]} />
                    )}                    
                    <a
                        className="flex gap-1 px-2 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                        target='_blank'
                        rel='noopener noreferrer'
                        href={'https://maps.google.com/?q=' + place.address}
                    >
                        Xem trên Google Map
                    </a>
                </div>
                
                <PlaceGallery place={place} />
            </div>

            {/* Report popup */}
            {isPopupOpen && !reported && (
                <div
                    id="popup-overlay"
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleOutsideClick}
                >
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-semibold mb-4">Lý do báo cáo</h2>
                        <textarea
                            className="w-full p-2 border rounded mb-4"
                            placeholder="Vui lòng cho biết lý do bạn báo cáo nhà này"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded"
                                onClick={() => setIsPopupOpen(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded"
                                onClick={handleSendReport}
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPopupOpen && reported && (
                <div
                    id="popup-overlay"
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={handleOutsideClick}
                >
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-semibold mb-4">Lý do báo cáo</h2>
                        <h2 className="text-md">Bạn đã báo cáo nhà này</h2>
                        <h2 className="text-md font-bold">Trạng thái:</h2>
                        {reported.status === 'PENDING' ? (
                            <p>Yêu cầu của bạn đang chờ.</p>
                        ) : (
                            <p>Yêu cầu của bạn đã được xử lý.</p>
                        )}
                        <h2 className="text-md font-bold">Nội dung:</h2>
                        <h2 className="text-lg">{reported.reason}</h2>
                    </div>
                </div>
            )}

            {/* thông tin chủ trọ */}
            <div className="mt-4 bg-gray-100 group transition duration-300 px-8 py-8 rounded-lg shadow-md">
                <div className="my-4">
                    <h2 className="font-semibold text-2xl text-gray-800 mb-6">Thông tin chủ nhà</h2>

                    {/* Hàng 1: Ảnh và tên */}
                    <div className="flex items-center ml-4 mb-6">
                        <a
                            href={`/profile/${place.owner.id}`} // Đường dẫn đến trang cá nhân
                            className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 shadow-lg flex-shrink-0"
                        >
                            <img
                                src={
                                    place.owner.avatar
                                    ? BASE_URL+place.owner.avatar
                                    : 'https://banner2.cleanpng.com/20180411/ike/avfjoey57.webp'
                                }
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </a>
                        <div className="ml-4">
                            <a
                                href={`/profile/${place.owner.id}`} // Đường dẫn đến trang cá nhân
                                className="text-lg font-semibold text-gray-800 hover:underline"
                            >
                            {place.owner.name}
                            </a>
                        </div>
                    </div>

                    {/* Hàng 2: Số điện thoại và Zalo */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="relative ml-8">
                            <p className="text-gray-600 font-semibold text-xl">Số điện thoại</p>
                            <div className="flex items-center">
                            <p className="text-gray-800 font-medium">{place.owner.phone ? place.owner.phone : 'Chưa cập nhật'}</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(place.owner.phone)}
                                className="ml-2 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                title="Copy số điện thoại"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                </svg>
                            </button>
                            </div>
                        </div>
                        <div className="relative">
                            <p className="text-gray-600 font-semibold text-xl">Zalo</p>
                            <div className="flex items-center">
                            <p className="text-gray-800 font-medium">{place.owner.zalo ? place.owner.zalo : 'Chưa cập nhật'}</p>
                            <button
                                onClick={() => navigator.clipboard.writeText(place.owner.zalo)}
                                className="ml-2 text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                title="Copy Zalo"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                </svg>
                            </button>
                            </div>
                        </div>
                    </div>
                    <div className='ml-8 border-t-2 my-2'>
                        <div className='text-gray-600 font-semibold text-lg'>Tham gia từ {new Date(place.owner.createAt).toLocaleDateString('vi-VN')}</div>
                        <div className='text-gray-600 font-semibold text-md'>Vi phạm: {place.owner.violationCount}</div>
                    </div>
                </div>
            </div>


            {/* Place Description and Details */}
            <div className='mt-4 mb-8 grid gap-8 grid-cols-1 md:grid-cols-[2fr_1fr] p-6 rounded-lg shadow-md bg-gray-100'>
                <div>
                    <div className='my-4'>
                        <h2 className='font-semibold text-2xl'>Mô tả</h2>
                        <div 
                            className='pt-2'
                            dangerouslySetInnerHTML={{ __html: place.description }} 
                        ></div>
                    </div>
                    <p className='font-bold inline'>Giá:</p> {place.price} triệu/tháng<br />
                    <p className='font-bold inline'>Diện tích:</p> {place.area} m²<br />
                    <p className='font-bold inline'>Thời hạn hợp đồng:</p> {place.duration} tháng<br />
                    <div className='border-b-4 my-2'></div>
                    <p className='font-bold inline'>Ngày đăng:</p> {new Date(place.createAt).toLocaleDateString()} <br />
                    <p className='font-bold inline'>Ngày chỉnh sửa gần nhất:</p> {new Date(place.updateAt).toLocaleDateString()} 
                </div>
                {bookingWidget}
            </div>

            {/* dịch vụ */}
            <div className="bg-gray-100 px-8 py-8 border-t mt-6 rounded-lg shadow-md">
                <h2 className="font-semibold text-2xl text-gray-800">Dịch vụ</h2>
                {place.perks.length > 0 ? (
                    <div className='grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mt-4'>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'wifi') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                            </svg>
                            <span>Wifi</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'parking') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                            <span>Gửi xe</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'elevator') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 7.5 16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0 0 12 6.75Zm-1.683 6.443-.005.005-.006-.005.006-.005.005.005Zm-.005 2.127-.005-.006.005-.005.005.005-.005.005Zm-2.116-.006-.005.006-.006-.006.005-.005.006.005Zm-.005-2.116-.006-.005.006-.005.005.005-.005.005ZM9.255 10.5v.008h-.008V10.5h.008Zm3.249 1.88-.007.004-.003-.007.006-.003.004.006Zm-1.38 5.126-.003-.006.006-.004.004.007-.006.003Zm.007-6.501-.003.006-.007-.003.004-.007.006.004Zm1.37 5.129-.007-.004.004-.006.006.003-.004.007Zm.504-1.877h-.008v-.007h.008v.007ZM9.255 18v.008h-.008V18h.008Zm-3.246-1.87-.007.004L6 16.127l.006-.003.004.006Zm1.366-5.119-.004-.006.006-.004.004.007-.006.003ZM7.38 17.5l-.003.006-.007-.003.004-.007.006.004Zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007Zm-.5 1.873h-.008v-.007h.008v.007ZM17.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                            </svg>
                            <span>Thang máy</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'washing') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                            <span>Máy giặt</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'pets') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                            </svg>
                            <span>Thú cưng</span>
                        </label>
                        <label className={`w-full border p-4 flex rounded-2xl gap-2 items-center ${place.perks.some(item => item.perk === 'clean') ? 'bg-blue-300' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                            </svg>
                            <span>Vệ sinh</span>
                        </label>
                    </div>
                ) : (
                    <p>Không có dịch vụ</p>
                )}
            </div>

            {/* Extra Info Section */}
            <div className="bg-gray-100 px-8 py-8 border-t mt-6 rounded-lg shadow-md">
                <h2 className="font-semibold text-2xl text-gray-800">Thông tin thêm</h2>
                {place.extraInfo ? (
                    <p className="text-gray-600 mt-4 leading-6">
                        <div 
                            className='pt-2'
                            dangerouslySetInnerHTML={{ __html: place.extraInfo }} 
                        ></div>
                    </p>
                ) : (
                    <p className='text-gray-500'>Chưa có thông tin</p>
                )}
            </div>

            {/* Comment section */}
            <CommentsSection placeId={place.id} userId={user?.id} />

            {/* History section */}
            <UserRentHistory rentHistory={bookingRented}/>
        </div>
    );
}

export default PlacePage;
