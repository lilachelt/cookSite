var substringMatcher = function() {
    //var strs = states;
    var strs = $.post('/autocomplete');


    return function findMatches(q, cb) {
        var matches, substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(strs, function(i, str) {
            if (substrRegex.test(str)) {
                matches.push(str);
            }
        });

        cb(matches);
    };
};

$('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'states',
        limit : 100,
        source: function(query, process,processAsync) {

            var query = $('#searchLine')[0].value;

            return $.post('./autocomplete', {query: query}, function(data){
                return processAsync(data);
            });
        },
        async:true
    });
