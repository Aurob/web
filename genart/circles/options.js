let options = {
    'reset': {
        'type': 'button',
        'action': function () {
            console.log('TODO reset');
        }
    },
    'pause': {
        'type': 'button',
        'action': function () {
            // noLoop();
            pause = !pause;
        }
    },
}

function loadOptions() {
    Object.keys(options).forEach(function (key) {
        let option = options[key];
        createOption(key, option);
    });
}

function createOption(key, option) {
    let div = $('<div>');
    let vallabel = $('<div class="val">');
    let input = $('<input>');
    input.attr('id', key);

    if (option.type == 'range' || option.type == 'number') {

        vallabel.text(key);
        div.append(vallabel);

        input.attr('type', option.type);
        input.attr('min', option.min);
        input.attr('max', option.max);
        if ('step' in option) input.attr('step', option.step);
        input.val(parseFloat(option.default));

        if('global' in option) window[key] = option.default;



        let value_container = $('<div>');
        value_container.text(option.default);
        input.on('input', function () {
            value_container.text(input.val());
            option.action(input.val());
        });

        div.append(value_container);
    }
    else if (option.type == 'button') {
        input.attr('type', option.type);
        input.val(key);
        input.click(option.action);
    }
    else if (option.type == 'checkbox') {
        div.text(key);
        input.attr('type', option.type);
        input.attr('checked', option.default);
        input.click(function () {
            option.action(input.is(':checked'));
        });
    }

    div.append(input);
    $('#options').append(div);
}