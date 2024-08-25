function sliderHandlers() {
    $('.slider').each(function() {
        $(this).find('.slider-item').first().addClass('slider-current-item').removeClass('hidden');
        if ($(this).find('.slider-item').length > 1) {
            $(this).closest('.speaker-item').find('.slider-next-item').removeClass('hidden');
        }
    });


    $('.slider-next-item').click(function() {
        var slider = $(this).closest('div');
        var elem = slider.find('.slider-current-item').next();
        if (elem.length) {
            elem.addClass('slider-current-item').removeClass('hidden');
            slider.find('.slider-current-item').first().removeClass('slider-current-item').addClass('hidden');
        } else {
            slider.find('.slider-item').first().addClass('slider-current-item').removeClass('hidden');
            slider.find('.slider-current-item').last().removeClass('slider-current-item').addClass('hidden');
        }
    });
}
