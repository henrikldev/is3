IS3.data = {
    types: {
        access: "Access Deprivation",
        crime: "Crime",
        education: "Education",
        employment: "Employment",
        health: "Health",
        housing: "Housing",
        income: "Income",
        overall: "Overall"
    },
    init: function() {
        $.each(this.types, function(key, value) {
            $('#app-factors').append('<option value="' + key + '">' + value + '</option>')
        });

        this.preloadData();
    },
    preloadData: function() {
        this.data = {};

        $.each(this.types, function(key, value) {
            d3.json("assets/data/factors/" + key + ".json", function (error, data) {
                IS3.data.data[key] = data;
            });
        });

        d3.json("assets/data/referendum.json", function (error, data) {
            IS3.data.data.referendum = data;
        });

        d3.json("assets/data/factors/overall.json", function(error, data) {
            IS3.data.data.councils = {};
            $.each(data.results.bindings, function() {
                var code = IS3.data.parseCouncilCode(this.council.value);
                IS3.data.data.councils[code] = this.label.value;

                $('#app-councils').append('<option value="' + code + '">' + this.label.value + '</option>')
                    .selectpicker('refresh');
            });
        });
    },
    getDeprivationPercentage: function(type, area) {
        // default
        var percentage = 1;

        $.each(this.data[type].results.bindings, function() {
            if (IS3.data.parseCouncilCode(this.council.value) == area)
                percentage = this.prop.value;
        });

        return 1 - percentage;
    },
    getDeprivationMin: function(type) {
        // default
        var min = null;

        $.each(this.data[type].results.bindings, function() {
            var value = 1 - this.prop.value;

            if (min == null || value < min)
                min = value;
        });

        return min;
    },
    getDeprivationMax: function(type) {
        // default
        var max = 0;

        $.each(this.data[type].results.bindings, function() {
            var value = 1 - this.prop.value;
            if (value > max)
                max = value;
        });

        return max;
    },
    parseCouncilCode: function(url) {
        return url.substr(url.lastIndexOf('/') + 1);
    },
    getReferrendumPercentage: function(council, yes) {
        var percentage = 0;
        if (typeof yes == "undefined")
            yes = true;

        $.each(this.data.referendum, function() {
            if (this.code == council) {
                if (yes)
                    percentage = this.yes / this.votes * 100;
                else
                    percentage = this.no / this.votes * 100;
            }
        });

        return parseInt(percentage);
    },
    getCouncilName: function(code) {
        return IS3.data.data.councils[code];
    },
    getSelectedCouncils: function() {
        if ($('#app-councils').val() == null) {
            var councils = [];
            $('#app-councils option').each(function () {
                councils.push($(this).val());
            });

            return councils;
        } else
            return $('#app-councils').val();
    },
    getChartData: function() {
        var councils = IS3.data.getSelectedCouncils(),
            lineData = [],
            data_type = $('#app-factors').val();

        $.each(councils, function() {
            lineData.push({
                gss: this,
                x: parseInt(IS3.data.getDeprivationPercentage(data_type, this) * 100),
                y: parseInt(IS3.data.getReferrendumPercentage(this))
            });
        });

        lineData.sort(function(a, b) {
            return a.x - b.x;
        });

        return lineData;
    }
};
