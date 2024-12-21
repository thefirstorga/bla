const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

const updateExpiredBookings = async () => {
    try {
        const today = new Date();
        const updatedBookings = await prisma.booking.updateMany({
            where: {
                status: 'APPROVED',
                checkOut: {
                    lte: today, // Nếu checkOut <= ngày hôm nay
                },
            },
            data: {
                status: 'RENTED', // Chuyển sang trạng thái RENTED
            },
        });

        console.log(`Đã cập nhật ${updatedBookings.count} bookings.`);
    } catch (error) {
        console.error('Lỗi khi cập nhật booking:', error);
    }
};

module.exports = updateExpiredBookings;